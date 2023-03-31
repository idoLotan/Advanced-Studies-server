const jwt = require("jsonwebtoken");

const privateKey = process.env.PRIVATE_KEY;

module.exports.jwtSign = (payload, expiresIn = "1h") => {
  const access_token = jwt.sign(payload, privateKey, { expiresIn });
  return access_token;
};

module.exports.jwtVerify = (token) => {
  const payload = jwt.verify(token, privateKey);
  return payload;
};
