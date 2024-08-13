import { writeFile } from 'fs';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import imgThumbnail from 'image-thumbnail';
// import mongoDBCore from 'mongodb/lib/core';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const writeFileAsync = promisify(writeFile);
const fileQueue = new Queue('thumbnail generation');
// console.log(fileQueue)
const sizes = [500, 250, 100];
const generateThumbnail = async (filePath, size) => {
  const buffer = await imgThumbnail(filePath, { width: size });
  console.log(`Generating file: ${filePath}, size: ${size}`);
  return writeFileAsync(`${filePath}_${size}`, buffer);
};

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');
  console.log('Processing', job.data.name);
  const file = await dbClient.getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });
  if (!file) throw new Error('File not found');
  Promise.all(sizes.map((size) => generateThumbnail(file.localPath, size)))
    .then(() => done());
});
