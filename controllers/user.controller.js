const { getPermissionsList } = require("../lib/permissions");
const { ErrUserNotFound, ErrConflict } = require("../lib/ResponseHandler");
const { getUserByEmail, getUserToken } = require("../services/users.service");
const ObjectId = require("mongodb").ObjectID;
const DB = require("../lib/dbControler");
const users = new DB("users");

//GET /me
module.exports.getMe = (req, res) => {
  const { user } = req;
  user.permissions = getPermissionsList(user.permissionId);

  res.ok(user);
};

module.exports.getPermissions = (req, res) => {
  const { user } = req;

  const permissions = getPermissionsList(user.permissionId);

  res.ok(permissions);
};

//POST /register
module.exports.postRegister = async (req, res, next) => {
  const { email } = req.body;

  const user = await getUserByEmail(email);

  if (user) {
    return next(ErrConflict());
  }
  const json = req.body;

  const newUser = await users.addItem(json);
  const expendedJson = { ...json, id: newUser.insertedId };
  const resp = await users.updateItem(newUser.insertedId, expendedJson);

  res.create({ ...json, _id: newUser.insertedId });
};

//POST /login
module.exports.postLogin = async (req, res, next) => {
  //get the user
  const { email, password } = req.body;
  console.log("req.body", req.body);

  const user = await getUserByEmail(email);

  if (!user) {
    return next(ErrUserNotFound());
  }

  if (user.password !== password) {
    return next(ErrUserNotFound());
  }

  //create access token with the user
  const access_token = getUserToken(user);

  //respond back
  res.ok({ access_token, user });
};
