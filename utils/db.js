import MongoClient from 'mongodb/lib/mongo_client';
import { ObjectId } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const db = process.env.DB_DATABASE || 'files_manager';
const URL = `mongodb://${host}:${port}/${db}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(URL, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db(db).collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db(db).collection('files').countDocuments();
  }

  async usersCollection() {
    return this.client.db(db).collection('users');
  }

  async filesCollection() {
    return this.client.db(db).collection('files');
  }

  async getUser(params) {
    let query = params;
    if (Object.keys(params).includes('_id')) {
      query = { ...params, _id: ObjectId(params._id) };
    }
    return this.client.db(db).collection('users').findOne(query);
  }

  async getFile(params) {
    let query = params;
    if (Object.keys(params).includes('objParentId')) {
      query = { ...params, _id: params.objParentId };
      delete query.objParentId;
    }
    return this.client.db(db).collection('files').findOne(query);
  }
}

const dbclient = new DBClient();

module.exports = dbclient;
