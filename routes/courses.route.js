const express = require("express");
const route = express.Router();
const DB = require("../lib/dbControler");
const { ErrItemAlreadyExists, CreatedRes } = require("../lib/ResponseHandler");
const {
  checkIfFieldExists,
  checkIfCourseExists,
  checkIfQuestionExists,
  updateFieldWithCourse,
  updateCourseWithQuestion,
  searchFields,
  searchCoursesByFields,
  searchCoursesByName,
  handleSearchResults,
  checkIfUserLogged,
  updateRating,
} = require("../utils/helper");
const fs = require("fs");
const ObjectId = require("mongodb").ObjectID;
const questions = new DB("questions");
const fields = new DB("fields");
const courses = new DB("courses");
const courseRating = new DB("course-rating");
const users = new DB("users");

const util = require("util");
const unlinkFile = util.promisify(fs.unlink);
const multer = require("multer");
const { getFileStream, uploadFile } = require("../lib/s3");
const { jwtVerify } = require("../lib/JWT");
const upload = multer({ dest: "uploads/" });

//  GET / get courses
route.get("/", async (req, res) => {
  const resp = await courses.get();
  res.send(resp);
});

//  GET / search course
route.get("/search", async (req, res) => {
  const textToSearchBy = req.query.text;
  const matchingFields = await searchFields(textToSearchBy);
  let returnList = await searchCoursesByFields(matchingFields);
  if (returnList.length === 0) {
    returnList = await searchCoursesByName(textToSearchBy);
  }
  handleSearchResults(returnList, res);
});

//  GET /get popular courses
route.get("/popular", async (req, res, next) => {
  // Get the course ratings from the courseRating module
  const temp = await courseRating.get();

  // Convert the object from temp to an array of key-value pairs
  var items = Object.keys(temp[0]).map(function (key) {
    return [key, temp[0][key]];
  });

  // Sort the array by the rating (second element in the key-value pair) in descending order
  items.sort(function (first, second) {
    return second[1] - first[1];
  });

  // Initialize an empty array to store the popular courses
  let returnVal = [];

  // Get the top 5 popular courses by slicing the sorted array
  const tempList = items.slice(1, 5);

  // Iterate through the top 5 popular courses and get the full course information by using the classes.getById(id) method
  for (let i = 0; i < tempList.length; i++) {
    let id = tempList[i][0];
    returnVal.push(await courses.getById(id));
  }

  // Return the popular courses in the response
  return res.ok(returnVal);
});

//  GET /get popular courses
route.get("/myCourses", async (req, res, next) => {});

//  GET / get questions
route.get("/questions", async (req, res) => {
  const resp = await questions.get();
  res.send(resp);
});

//  GET /get fields
route.get("/fields", async (req, res) => {
  const resp = await fields.get();
  res.send(resp);
});

//  GET /get course by name
route.get("/name", async (req, res) => {
  const courseName = req.query.courseName;
  const course = await courses.getByCourseName(courseName);
  res.ok(course);
});

//  GET /get question by name
route.get("/questions/name", async (req, res) => {
  const question = req.query.question;
  console.log("question", question);
  const resp = await questions.getByQuestionName(question);
  console.log("getByQuestionName", resp);
  res.ok(resp);
});

//  GET /get course by id
route.get("/:id", async (req, res) => {
  const { id } = req.params;
  const course = await courses.getById(id);
  res.ok(course);
});

//  GET /get question by id
route.get("/questions/:id", async (req, res) => {
  const { id } = req.params;
  const question = await questions.getById(id);
  res.ok(question);
});

//  GET /get field by id
route.get("/fields/:id", async (req, res) => {
  const { id } = req.params;
  const field = await fields.getById(id);
  res.ok(field);
});

//  POST /add course
route.post("/addCourse/:fieldName", async (req, res) => {
  const { courseName } = req.body;
  if (await checkIfCourseExists(courseName)) {
    return res.send(ErrItemAlreadyExists("course"));
  }
  try {
    const newCourse = await courses.addItem(req.body);
    const resp = await updateRating(newCourse._id);
    console.log("resp", resp);
    const fieldName = req.params.fieldName;

    await updateFieldWithCourse(fieldName, newCourse._id);
    return res.send(newCourse);
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
});

//  POST /add question
route.post("/questions/:courseName", async (req, res) => {
  console.log("first");
  const { question } = req.body;
  if (await checkIfQuestionExists(question)) {
    return res.ok(ErrItemAlreadyExists("question"));
  }
  try {
    const newQuestion = await questions.addItem(req.body);
    console.log("newQuestion", newQuestion);

    const courseName = req.params.courseName;

    const resp = await updateCourseWithQuestion(courseName, newQuestion._id);
    return res.send(newQuestion);
  } catch (error) {
    return res.send(error);
  }
});

//  POST /add field
route.post("/fields", async (req, res) => {
  const { field } = req.body;
  const fieldExists = await checkIfFieldExists(field);
  if (fieldExists) {
    return res.send(ErrItemAlreadyExists("fields"));
  }
  try {
    let temp = req.body;
    temp.course = [];
    return res.send(CreatedRes(await fields.addItem({ ...temp })));
  } catch (error) {
    return res.send(error);
  }
});

//  DELETE /delete field
route.delete("/fields/:id", async (req, res) => {
  const { id } = req.params;
  const resp = fields.deleteById(id);
  res.ok("resp");
});

//  DELETE /delete course
route.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const resp = await courses.deleteById(id);
  res.ok(resp);
});

//  DELETE /delete question
route.delete("/questions/:id", async (req, res) => {
  const { id } = req.params;
  const resp = await questions.deleteById(id);
  res.ok(resp);
});

//  GET /get image
route.get("/images/:key", (req, res) => {
  const key = req.params.key;
  const readStream = getFileStream(key);
  readStream.pipe(res);
});

//  POST /post course page image
route.post("/images/page/:id", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    await unlinkFile(file.path);
    const description = req.body.description;
    const { id } = req.params;
    const json = req.body;
    const expendedJson = { ...json, pageImgUrl: file.filename };
    const resp = await courses.updateItem(id, expendedJson);
    res.send(resp);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

//  POST /post course icon image
route.post("/images/card/:id", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    await unlinkFile(file.path);
    const description = req.body.description;
    const { id } = req.params;
    const json = req.body;
    const expendedJson = { ...json, iconImgUrl: file.filename };
    const resp = await courses.updateItem(id, expendedJson);

    res.send(resp);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

route.post("/images/question/:id", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const result = await uploadFile(file);
    await unlinkFile(file.path);
    const description = req.body.description;
    const { id } = req.params;
    const json = req.body;
    const expendedJson = { ...json, questionImg: file.filename };
    const resp = await questions.updateItem(id, expendedJson);

    res.send(resp);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

//  POST /login start courses
route.post("/login/rate/:id", async (req, res, next) => {
  // Extract the classId from the request body
  const userId = req.params.id;
  const courseId = req.body.id;
  // Get the user object from the database
  const user = await users.getById(userId);

  if (!user.courses) {
    user.courses = {};
  }

  if (!user.courses[courseId]) {
    user.courses[courseId] = [];
  }

  // If not, increment the class's rating Add the class to the user's list of classes
  await users.updateItem(user._id, user);

  // Update the class rating in the database
  const resp = await updateRating(courseId);
  return res.ok(resp);
});

//  POST /notLogin start courses
route.post("/rate/:id", async (req, res, next) => {
  const { id } = req.params;
  console.log("id =>", id);
  const resp = await updateRating(id);
  console.log("resp =>", resp);
  return res.ok(resp);
});

// //POST /submit answer
// route.post("/login/submitAnswer/:id", async (req, res, next) => {
//   // get the question id from the request parameters
//   const questionId = req.params.id;
//   const { courseId } = req.body;
//   const { userId } = req.body;

//   //chek if user logged

//   const Authorization = req.headers.authorization;

//   const { success: isLogged } = await checkIfUserLogged(Authorization);

//   if (!isLogged) {
//     return res.ok("not logged");
//   }

//   const user = await users.getById(userId);

//   // check if the user has not yet started any course
//   if (!user.courses) {
//     user.courses = {};
//     user.courses[courseId] = [questionId];
//     const temp = user._id;
//     delete user._id;
//     await users.updateItem(temp, user);
//     return res.ok("Your Answer has been successfully received");
//   }
//   // check if the user has not yet started the course
//   if (!user.courses[courseId]) {
//     user.courses[courseId] = [questionId];
//     const temp = user._id;
//     delete user._id;
//     await users.updateItem(temp, user);
//     return res.ok("Your Answer has been successfully received");
//   }
//   // check if the user has not yet answered the question
//   if (!user.courses[courseId].includes(questionId)) {
//     user.courses[courseId] = [...user.courses[courseId], questionId];
//     const temp = user._id;
//     delete user._id;
//     await users.updateItem(temp, user);
//     return res.ok("Your Answer has been successfully received");
//   }
//   return res.ok("You have already answered this question");
// });

route.post("/login/submitAnswer/:id", async (req, res, next) => {
  const { courseId, userId } = req.body;
  const questionId = req.params.id;
  const [isLogged, user] = await Promise.all([
    checkIfUserLogged(req.headers.authorization),
    users.getById(userId),
  ]);

  if (!isLogged.success) {
    return res.ok("not logged");
  }
  // check if the user has not yet started any course
  if (!user.courses) {
    user.courses = {};
  }
  // check if the user has not yet started the course
  if (!user.courses[courseId]) {
    user.courses[courseId] = [];
  }

  if (user.courses[courseId].includes(questionId)) {
    return res.ok("You have already answered this question");
  }
  // check if the user has not yet answered the question
  user.courses[courseId].push(questionId);
  await users.updateItem(user._id, user);

  return res.ok("Your Answer has been successfully received");
});

// route.post("/login/submitAnswer/:id", async (req, res, next) => {
//   // get the question id and courseId from the request parameters
//   const questionId = req.params.id;
//   const { courseId } = req.body;

//   // check if user is logged in
//   const { authorization } = req.headers;
//   const { success: isLogged } = await checkIfUserLogged(authorization);
//   if (!isLogged) {
//     return res.ok("not logged");
//   }

//   // get user data
//   const user = await users.getById("63d68d021ac39432d01f6ee0");

//   // check if the user has not yet started the course or answered the question
//   if (!user.courses[courseId] || !user.courses[courseId].includes(questionId)) {
//     user.courses[courseId] = [...(user.courses[courseId] || []), questionId];
//     await users.updateItem(user._id, user);
//     return res.ok("Your Answer has been successfully received");
//   }

//   return res.ok("You have already answered this question");
// });

module.exports = route;
