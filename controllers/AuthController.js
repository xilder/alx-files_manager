import { v4 as uuid4 } from 'uuid';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const { user } = req;
    const token = uuid4();
  }
}

module.exports = AuthController;
