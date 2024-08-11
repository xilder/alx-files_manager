import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

const userUtils = {
  async getUserWithToken(req) {
    const xToken = req.header('X-Token');
    const userId = xToken ? await redisClient.get(`auth_${xToken}`) : null;
    const user = await dbClient.getUser({ _id: ObjectId(userId) });
    return user;
  },
};

module.exports = userUtils;
