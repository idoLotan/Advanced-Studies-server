const express = require("express");
const {
  postRegister,
  postLogin,
  getMe,
  getPermissions,
} = require("../controllers/user.controller");
const route = express.Router();
const { validateDto } = require("../dto/validate");
const { usersSchema, userRegistrationSchema } = require("../dto/users.schema");
const DB = require("../lib/dbControler");
route.post("/register", validateDto(userRegistrationSchema), postRegister);
route.post("/login", postLogin);

route.get("/permissions", getPermissions);
route.get("/me", getMe);

const users = new DB("users");
const ObjectId = require("mongodb").ObjectID;

// //  GET / get users
route.get("/", async (req, res) => {
  const resp = await users.get();
  res.send(resp);
});

// //  GET / get user by email
route.post("/email", async (req, res) => {
  const { email } = req.body;
  const user = await users.getByEmail(email);
  res.send(user);
});

// //  GET / get user by id
route.get("/:id", async (req, res) => {
  const { id } = req.params;
  const user = await users.getById(id);
  res.ok(user);
});

// //  POST /add user
route.post("/", validateDto(usersSchema), async (req, res) => {
  const json = req.body;
  const newUser = await users.addItem(json);
  res.ok({ ...json, _id: newUser.insertedId });
});

//   PUT /edit pet
route.put("/:id", validateDto(usersSchema), async (req, res) => {
  const { id } = req.params;
  const json = req.body;
  const expendedJson = { ...json, another: "another" };
  const resp = await users.updateItem(id, expendedJson);
  res.ok(resp);
});

// //  DELETE /delete pet
route.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const resp = await users.deleteById(id);
  res.ok(resp);
});

module.exports = route;
