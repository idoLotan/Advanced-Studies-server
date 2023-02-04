const yup = require("yup");

let petsSchema = yup.object().shape({
  name: yup
    .string()
    .required()
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field "),
  description: yup.string(),
});

module.exports = { petsSchema };
