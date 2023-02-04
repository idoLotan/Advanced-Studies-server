const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_CONNECTION_STRING;

let advancedStudies = {};

MongoClient.connect(uri, { useUnifiedTopology: true }).then((client, err) => {
  if (err) {
    console.log("Unable to connect to MongoDB");
    return;
  }

  console.log("Mongo DB is connected");

  advancedStudies = client.db("advanced-studies");
});

module.exports = {
  mongo_collection: (name) => {
    return advancedStudies.collection(name);
  },
};
