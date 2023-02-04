const yup = require("yup");

let usersSchema = yup.object().shape({
  firstName: yup
    .string()
    .required()
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field "),

  email: yup.string().email(),
});

let userRegistrationSchema = yup.object().shape({
  firstName: yup
    .string()
    .required()
    .matches(/^[aA-zZ\s]+$/, "Only alphabets are allowed for this field "),
  email: yup.string().required().email(),
  password: yup.string().required(),
});

let userLoginSchema = yup.object().shape({
  email: yup.string().required().email(),
  password: yup.string().required(),
});

module.exports = {
  usersSchema,
  userRegistrationSchema,
  userLoginSchema,
};
