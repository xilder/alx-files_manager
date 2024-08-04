import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(_, res) {
    const status = { redis: redisClient.isAlive(), db: dbClient.isAlive() };
    res.json(status);
  }

  static async getStats(_, res) {
    const stats = {
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    };
    res.status = 200;
    res.json(stats);
  }
}

module.exports = AppController;
