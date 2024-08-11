import dbClient from '../utils/db';
// import redisClient from '../utils/redis';
import userUtils from '../utils/user';
import fileUtils from '../utils/file';

const fileTypes = ['folder', 'file', 'image'];

class FilesController {
  static async postUpload(req, res) {
    try {
      const user = await userUtils.getUserWithToken(req);
      if (!user) return res.status(401).send({ error: 'Unauthorized' });

      const { name, type, parentId = 0, isPublic = false, data } = req.body;
      if (!name) {
        return res.statusCode(400).send({ error: 'Missing name' });
      }
      if (!type || !fileTypes.includes(type)) {
        return res.statusCode(400).send({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.statusCode(400).send({ error: 'Missing data' });
      }
      if (parentId) {
        console.log(parentId)
        const fileMeta = await dbClient.getFile({ parentId });
        console.log(fileMeta)
        if (!fileMeta) {
          return res.statusCode(400).send({ error: 'Parent not found' });
        }
        if (fileMeta.type !== 'folder') {
          return res.status(400).send({ error: 'Parent is not a folder' });
        }
      }
      const file = {
        name,
        type,
        parentId,
        isPublic,
        userId: user._id,
      };
      console.log(file)
      if (type !== 'folder') {
        const newFile = await fileUtils.writeFile({ ...file, data });
        console.log(newFile);
        return res.status(201).json(newFile);
      }
      const newFolder = await fileUtils.createFolder({ ...file });
      return res.status(201).json(newFolder);
    } catch (err) {
      console.log(err)
      return res.status(401).send({ error: 'Error' });
    }
  }
}

module.exports = FilesController;
