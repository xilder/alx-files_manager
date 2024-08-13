import { v4 as uuid4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    try {
      const authorization = req.header('Authorization') || '';
      const credentials = authorization.split(' ')[1];

      const decodedCredentials = Buffer.from(credentials, 'base64').toString(
        'utf-8',
      );

      const [email, password] = decodedCredentials.split(':');
      const sha1Password = sha1(password);

      const user = await dbClient.getUser({ email, password: sha1Password });
      // console.log(user)
      const token = uuid4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 24 * 60 * 60);
      return res.status(200).json({ token });
    } catch (err) {
      console.log(err);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['X-token'];

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
  }
}

module.exports = AuthController;
