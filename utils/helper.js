const DB = require("../lib/dbControler");
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

module.exports.updateFieldWithCourse = async (fieldName, courseId) => {
  const field = await fields.getByFieldName(fieldName);
  console.log("field", field);
  if (!field.course) {
    field.course = [courseId];
  } else {
    field.course = [...field.course, courseId];
  }
  await fields.updateItem(field._id, field);
};

module.exports.updateCourseWithQuestion = async (courseName, questionId) => {
  try {
    console.log("courseName, questionId", courseName, questionId);
    const course = await courses.getByCourseName(courseName);
    console.log(course, course);
    if (!course.questions) {
      console.log("first");
      course.questions = [questionId];
    } else {
      course.questions = [...course.questions, questionId];
    }
    const resp = await fields.updateItem(course._id, course);
    return;
  } catch (err) {
    console.log(err);
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
  console.log("AllField", AllField);
  return AllField.filter((field) => field.field.includes(textToSearchBy));
};

module.exports.searchCoursesByFields = async (matchingFields) => {
  const matchingCourses = await Promise.all(
    matchingFields.map(async (field) => {
      return field.course.map(async (id) => await courses.getById(id));
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
    return res.ok(
      ErrItemDoesntExist("A field or course that matches the search term")
    );
  } else return res.ok(returnList);
};

// module.exports.checkIfUserLogged = async (authorization) => {
//   if (!authorization) {
//     console.log("not connected ");
//     return false;
//   } else {
//     try {
//       const decoded = jwtVerify(authorization);
//       const user = await users.getById(decoded.id);
//       if (!user) {
//         console.log("not connected ");
//         return false;
//       }
//       console.log("connected");
//       return true;
//     } catch (err) {
//       console.log(err);
//     }
//   }
// };

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

module.exports.updateRating = async (id) => {
  const rating = await courseRating.get();
  if (!rating[0][id]) {
    rating[0][id] = 1;
    const ObjectID = rating[0]._id;
    delete rating[0]._id;
    const resp = await courseRating.updateItem(ObjectID, rating[0]);
    return resp;
  }

  rating[0][id]++;
  const ObjectID = rating[0]._id;
  delete rating[0]._id;
  const resp = await courseRating.updateItem(ObjectID, rating[0]);
  return resp;
};
