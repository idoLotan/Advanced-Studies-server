const { jwtSign } = require("../lib/JWT");
const ObjectId = require("mongodb").ObjectID;
const DB = require("../lib/dbControler");
const users = new DB("users");

module.exports.getUserByEmail = async (email) => {
  const user = await users.getByEmail(email);
  return user;
};

module.exports.getUserToken = (user) => {
  const id = user._id;
  delete user.password;
  const access_token = jwtSign({ id });
  return access_token;
};
