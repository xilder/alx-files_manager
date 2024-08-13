import { contentType } from 'mime-types';
import { join } from 'path';
import { v4 as uuid4 } from 'uuid';
import { mkdir, writeFile, realpath, existsSync } from 'fs';
import { promisify } from 'util';
import { ObjectId } from 'mongodb';
import dbClient from './db';
// import redisClient from './redis';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
const mkDirAsync = promisify(mkdir);
const realpathAsync = promisify(realpath);
const writeFileAsync = promisify(writeFile);

const fileUtils = {
  writeFile: async ({ userId, name, type, parentId, isPublic, data }) => {
    const id = uuid4();
    const baseDir = join(FOLDER_PATH, id);

    await mkDirAsync(FOLDER_PATH, { recursive: true });
    await writeFileAsync(baseDir, Buffer.from(data, 'base64'));
    const localPath = await realpathAsync(baseDir);

    const newFile = {
      userId: ObjectId(userId),
      name,
      type,
      parentId,
      isPublic,
      localPath,
    };
    const insertedFile = await (
      await dbClient.filesCollection()
    ).insertOne(newFile);
    return {
      id: insertedFile.insertedId.toString(),
      userId: userId.toString(),
      name,
      type,
      isPublic,
      parentId,
      localPath,
    };
  },

  createFolder: async ({ userId, name, type, parentId }) => {
    const createdFolder = {
      userId: ObjectId(userId),
      name,
      type,
      parentId,
    };
    const newFolder = await (
      await dbClient.filesCollection()
    ).insertOne(createdFolder);
    return {
      userId,
      name,
      type,
      parentId,
      id: newFolder.insertedId.toString(),
    };
  },

  sendFile: async (res, file, realFilePath) => {
    res.setHeader(
      'Content-Type',
      contentType(file.name) || 'text/plain; charset=utf-8'
    );
    return res.status(200).sendFile(realFilePath);
  },
};

module.exports = fileUtils;
