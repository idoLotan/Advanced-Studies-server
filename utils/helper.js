const DB = require("../lib/dbControler");
const { jwtVerify } = require("../lib/JWT");
const { ErrItemDoesntExist } = require("../lib/ResponseHandler");

const fields = new DB("fields");
const questions = new DB("questions");
const courses = new DB("courses");
const users = new DB("users");
const courseRating = new DB("course-rating");

module.exports.checkIfFieldExists = async (fieldName) => {
  const existingField = await fields.getByFieldName(fieldName);
  if (!existingField) {
    return false;
  }
  return true;
};

module.exports.checkIfCourseExists = async (courseName) => {
  console.log("courseName", courseName);
  const existingField = await courses.getByCourseName(courseName);
  if (!existingField) {
    return false;
  }
  return true;
};

module.exports.checkIfQuestionExists = async (questionName) => {
  const existingField = await questions.getByQuestionName(questionName);
  if (!existingField) {
    return false;
  }
  return true;
};

module.exports.updateFieldWithCourse = async (fieldName, courseObjectId) => {
  const field = await fields.getByFieldName(fieldName);

  const courseId = courseObjectId.toString();
  if (!field.course) {
    field.course = [courseId];
  } else {
    field.course = [...field.course, courseId];
  }
  await fields.updateItem(field._id, field);
};

module.exports.updateCourseWithQuestion = async (courseName, questionId) => {
  try {
    const courseDetails = await courses.getByCourseName(courseName);
    let questions = courseDetails.questions || [];
    questions = [...questions, questionId.toString()];
    courseDetails.questions = questions;
    const courseId = courseDetails._id;
    delete courseDetails._id;
    const updateResponse = await courses.updateItem(courseId, courseDetails);
    return;
  } catch (error) {
    console.error(error);
  }
};

// module.exports.updateUserCourse = async (user, courseId) => {
//   if (!user.myCourse[courseId]) {
//     user.myCourse[courseId] = [];
//   }
//   let temp = user._id;
//   delete user._id;
//   await users.updateItem(temp, user);
// };

module.exports.updateCourseRathing = async (courseId) => {
  let course = await courses.getById(courseId);
  if (!course.rating) {
    course = { ...course, rating: 1 };
  } else {
    course.rating++;
  }
  await courses.updateItem(course, courseId);
  return course;
};

module.exports.searchFields = async (textToSearchBy) => {
  const AllField = await fields.get();
  return AllField.filter((field) => field.field.includes(textToSearchBy));
};

module.exports.searchCoursesByFields = async (matchingFields) => {
  const matchingCourses = await Promise.all(
    matchingFields.map(async (field) => {
      const coursesList = await Promise.all(
        field.course.map(async (id) => await courses.getById(id))
      );
      return coursesList;
    })
  );

  return [].concat(...matchingCourses);
};

module.exports.searchCoursesByName = async (textToSearchBy) =>
  (await courses.get()).filter((course) =>
    course.courseName.includes(textToSearchBy)
  );

module.exports.handleSearchResults = (returnList, res) => {
  if (returnList.length == 0) {
    return res.send(
      ErrItemDoesntExist("A field or course that matches the search term")
    );
  } else return res.send(returnList);
};

module.exports.checkIfUserLogged = async (authorization) => {
  if (!authorization) {
    return { success: false, message: "User not logged in" };
  } else {
    try {
      const decoded = jwtVerify(authorization);
      const user = await users.getById(decoded.id);
      if (!user) {
        return { success: false, message: "User not found" };
      }
      return { success: true, message: "User logged in" };
    } catch (err) {
      return { success: false, message: "Invalid token" };
    }
  }
};

module.exports.updateRating = async (courseId) => {
  const ratingRecord = await courseRating.get();
  const courseRatings = ratingRecord[0];

  if (!courseRatings[courseId]) {
    courseRatings[courseId] = 1;
  } else {
    courseRatings[courseId]++;
  }

  const recordId = courseRatings._id;
  delete courseRatings._id;

  const updateResponse = await courseRating.updateItem(recordId, courseRatings);
  return updateResponse;
};
