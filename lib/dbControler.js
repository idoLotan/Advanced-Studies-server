const { mongo_collection } = require("./mongo");
const { ObjectId } = require("mongodb");

class DB {
  constructor(name) {
    this.name = name;
  }

  get = async () => {
    const content = await mongo_collection(this.name).find({}).toArray();
    return content;
  };

  getById = async (id) => {
    try {
      const content = await mongo_collection(this.name).findOne({
        _id: ObjectId(id),
      });

      return content;
    } catch (err) {
      console.log("err in get by id ", err);
      return false;
    }
  };

  getByEmail = async (email) => {
    try {
      const content = await mongo_collection(this.name).findOne({
        email: email,
      });
      return content;
    } catch (err) {
      return false;
    }
  };
  getByFieldName = async (name) => {
    console.log("name", name);
    try {
      const content = await mongo_collection(this.name).findOne({
        field: name,
      });
      console.log("content", content);
      return content;
    } catch (err) {
      return false;
    }
  };
  getByCourseName = async (courseName) => {
    try {
      const content = await mongo_collection(this.name).findOne({
        courseName: courseName,
      });
      return content;
    } catch (err) {
      return false;
    }
  };

  getByQuestionName = async (question) => {
    try {
      const content = await mongo_collection(this.name).findOne({
        question: question,
      });
      return content;
    } catch (err) {
      return false;
    }
  };
  addItem = async (json) => {
    const content = await mongo_collection(this.name).insertOne(json);
    const returnVal = await mongo_collection(this.name).findOne({
      _id: ObjectId(content.insertedId),
    });
    return returnVal;
  };
  deleteById = async (id) => {
    const content = await mongo_collection(this.name).deleteOne({
      _id: ObjectId(id),
    });
    return "item deleted";
  };
  updateItem = async (id, json) => {
    console.log("id, json", id, json);
    try {
      const content = await mongo_collection(this.name).updateOne(
        { _id: ObjectId(id) },
        {
          $set: json,
        }
      );
      return { "item is updated": json };
    } catch (err) {
      console.log(err);
    }
  };
}

module.exports = DB;
