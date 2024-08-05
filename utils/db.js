import MongoClient from 'mongodb/lib/mongo_client';

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
    return this.client.db(db).collection('users').findOne(params);
  }

  async getFile(params) {
    return this.client.db(db).collection('files').findOne(params);
  }
}

const dbclient = new DBClient();

module.exports = dbclient;
