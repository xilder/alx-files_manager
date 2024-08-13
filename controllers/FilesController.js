import { ObjectId } from 'mongodb';
import Queue from 'bull/lib/queue';
import { existsSync, realpath } from 'fs';
import { promisify} from 'util';
import dbClient from '../utils/db';

// import redisClient from '../utils/redis';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';

const fileTypes = ['folder', 'file', 'image'];
const fileQueue = new Queue('thumbnail generation');
const realpathAsync = promisify(realpath)
// console.log(fileQueue);

class FilesController {
  static async postUpload(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { name, type, parentId = 0, isPublic = false, data } = req.body;
      if (!name) {
        return res.statusCode(400).json({ error: 'Missing name' });
      }
      if (!type || !fileTypes.includes(type)) {
        return res.statusCode(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.statusCode(400).json({ error: 'Missing data' });
      }
      if (parentId) {
        const objParentId =
          parentId !== '0' && parentId !== 0 ? ObjectId(parentId) : parentId;
        const fileMeta = await dbClient.getFile({ _id: objParentId });
        // console.log(objParentId);
        if (!fileMeta && objParentId !== '0' && objParentId !== 0) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (
          objParentId !== '0' &&
          objParentId !== 0 &&
          fileMeta.type !== 'folder'
        ) {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }
      const file = {
        name,
        type,
        parentId,
        isPublic,
        userId: user._id,
      };

      if (type !== 'folder') {
        const newFile = await fileUtils.writeFile({ ...file, data });
        newFile.parentId = newFile.parentId === '0' ? 0 : newFile.parentId;
        if (type === 'image') {
          // console.log(newFile.id)
          const fileId = newFile.id;
          const userId = user._id.toString();
          const jobName = `Image thumbnail [${userId}-${fileId}]`;
          fileQueue.add({ userId, fileId, name: jobName });
        }
        return res.status(201).json(newFile);
      }
      const newFolder = await fileUtils.createFolder({ ...file });
      newFolder.parentId = newFolder.parentId === '0' ? 0 : newFolder.parentId;
      return res.status(201).json(newFolder);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getShow(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);

      const { id } = req.params;
      const fileMeta = await dbClient.getFile({
        userId: ObjectId(user._id),
        _id: ObjectId(id),
      });
      if (!fileMeta) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json({
        id,
        userId: user._id,
        name: fileMeta.name,
        type: fileMeta.type,
        isPublic: fileMeta.isPublic,
        parentId: fileMeta.parentId === '0' ? 0 : fileMeta.parentId.toString(),
      });
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getIndex(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);
      const { page } =
        !Number.isNaN(req.query.page) && req.query.page > 0 ? req.query : 0;
      const parentId =
        !req.query.parentId ||
        req.query.parentId === '0' ||
        req.query.parentId === 0
          ? '0'
          : ObjectId(req.query.parentId);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      let folder = await dbClient.getFile({ _id: parentId });
      if (parentId === 0 || parentId === '0') folder = { type: 'folder' };
      if (!folder || folder.type !== 'folder') return res.status(200).json([]);
      const pipeline = [
        // { $match: { parentId } },
        { $skip: page * 20 },
        { $limit: 20 },
      ];
      const paginatedFiles = await (
        await dbClient.paginateFiles(pipeline)
      ).toArray();
      // console.log(await paginatedFiles.toArray());
      for (const file of paginatedFiles) {
        file.parentId = file.parentId === '0' ? 0 : file.parentId;
      }
      return res.status(200).json(paginatedFiles);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async putPublish(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);
      const { id } = req.params;
      const params = {
        userId: ObjectId(user._id),
        _id: ObjectId(id),
      };
      const fileMeta = await dbClient.getFile(params);
      if (!fileMeta) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.updateFile(params, true);
      fileMeta.isPublic = true;
      fileMeta.parentId = fileMeta.parentId === '0' ? 0 : fileMeta.parentId;
      return res.status(200).json(fileMeta);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async putUnpublish(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);
      const { id } = req.params;
      const params = {
        userId: ObjectId(user._id),
        _id: ObjectId(id),
      };
      const fileMeta = await dbClient.getFile(params);
      if (!fileMeta) {
        return res.status(404).json({ error: 'Not found' });
      }
      await dbClient.updateFile(params, false);
      fileMeta.isPublic = false;
      fileMeta.parentId = fileMeta.parentId === '0' ? 0 : fileMeta.parentId;
      return res.status(200).json(fileMeta);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getFile(req, res) {
    try {
      const { id } = req.params;
      const { size } = req.query;
      const query = { _id: ObjectId(id) };
      const fileMeta = await dbClient.getFile(query);
      // console.log(fileMeta);

      let realFilePath = await realpathAsync(fileMeta.localPath);
      if (size) realFilePath = `${realFilePath}_${size}`;
      if (!existsSync(realFilePath)) {
        // console.log(existsSync(realFilePath), size);
        return res.status(404).json({ error: 'Not found' });
      }

      if (!req.header('X-Token') && fileMeta.isPublic === true) {
        if (fileMeta.type === 'folder') {
          return res
            .status(400)
            .json({ error: "A folder doesn't have content" });
        }
        return fileUtils.sendFile(res, fileMeta, realFilePath);
      }
      const user = await userUtils.getUserWithToken(req);
      if (!user || user._id.toString() !== fileMeta.userId.toString()) {
        console.log(user);
        console.log(fileMeta);
        return res.status(404).json({ error: 'Not found' });
      }
      if (fileMeta.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }
      // console.log(size);
      return fileUtils.sendFile(res, fileMeta, realFilePath);
    } catch (err) {
      console.log(err);
      return res.status(404).json({ error: 'Not found' });
    }
  }
}

module.exports = FilesController;
