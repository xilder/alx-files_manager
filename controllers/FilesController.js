import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
// import redisClient from '../utils/redis';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';

const fileTypes = ['folder', 'file', 'image'];

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
        const fileMeta = await dbClient.getFile({ objParentId });
        if (!fileMeta) {
          return res.statusCode(400).json({ error: 'Parent not found' });
        }
        if (fileMeta.type !== 'folder') {
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
        console.log(newFile);
        return res.status(201).json(newFile);
      }
      const newFolder = await fileUtils.createFolder({ ...file });
      return res.status(201).json(newFolder);
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Error' });
    }
  }

  static async getShow(req, res) {
    const user = await userUtils.getUserWithToken(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
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
      parentId: fileMeta.parentId.toString(),
    });
  }
}

module.exports = FilesController;
