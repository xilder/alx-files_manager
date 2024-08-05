import dbClient from './db';

const userUtils = {
  async getUser() {
    const users = await dbClient.usersCollection();
    console.log(users);
    return users;
  },
};

module.exports = userUtils;
