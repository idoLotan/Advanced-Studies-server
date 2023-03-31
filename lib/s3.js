require("dotenv").config();
const fs = require("fs");
const S3 = require("aws-sdk/clients/s3");

const bucketName = "ido-lotan-bucket";
const region = "eu-west-1";
const accessKeyId = "AKIARQ77BGRZXX5JZDWJ ";
const secretAccessKey = "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";

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

// uploads a file to s3
function uploadFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename,
  };

  return s3.upload(uploadParams).promise();
}
exports.uploadFile = uploadFile;

function uploadVideoFile(file) {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: file.filename + ".mp4", // append .mp4 to the filename
    ContentType: "video/mp4", // set the content type to video/mp4
  };

  return s3.upload(uploadParams).promise();
}
exports.uploadVideoFile = uploadVideoFile;

// downloads a file from s3
function getFileStream(fileKey) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };

  return s3.getObject(downloadParams).createReadStream();
}
exports.getFileStream = getFileStream;
