const express = require("express");
const app = express();
app.use(express.json());
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectID;
const DB = require("./lib/dbControler");
const users = new DB("users");
const { MongoClient } = require("mongodb");
const {
  ErrNotAuthed,
  ErrUserNotFound,
  ValidRes,
  CreatedRes,
} = require("./lib/ResponseHandler");
const { jwtVerify } = require("./lib/JWT");
const uri = process?.env?.MONGODB_CONNECTION_STRING;
const client = new MongoClient(uri);

//auth layer

app.use(
  cors({
    origin: "*",
    // credentials: true,
  })
);

//auth middleware
app.use(async (req, res, next) => {
  const authorized = ["/users/login", "/users/register"];

  if (authorized.includes(req.url)) {
    return next();
  }

  const requestUrl = req.url;

  if (requestUrl.includes("/images") || requestUrl.includes("/courses")) {
    return next();
  }

  const { authorization } = req.headers;

  try {
    const decoded = jwtVerify(authorization);
    const user = await users.getById(decoded.id);
    if (!user) {
      return next(ErrUserNotFound());
    }

    delete user.password;

    req.user = user;

    return next();
  } catch (error) {
    next(ErrNotAuthed());
  }
});

//3) verify that the token is valid
//4) verify user exist

app.use((req, res, next) => {
  res.ok = (data) => {
    const resp = ValidRes(data);
    res.block(resp);
  };

  res.create = (data) => {
    const resp = CreatedRes(data);
    res.block(resp);
  };

  //...

  res.block = (resp) => {
    res.status(resp.status).send(resp.payload);
  };

  next();
});

app.use("/users", require("./routes/users.route"));
app.use("/courses", require("./routes/courses.route"));
app.use((err, req, res, next) => {
  console.log("err ->>> ", err);
  res.send(err);
});

// app.listen(process.env.PORT, () => {
//   console.log("Express is listening on port ", process.env.PORT);
// });

client.connect((err) => {
  console.log("connected to mongo");
  if (err) {
    console.error(err);
    return false;
  }
  // connection to mongo is successful, listen for requests
  app.listen(process.env.PORT, () => {
    console.log("Express is listening on port ", process.env.PORT);
  });
});
