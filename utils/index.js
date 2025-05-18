const resetPasswordEmail = require("./resetPasswordEmail");
const validationEmail = require("./validationEmail");
const { createCookie, verifyCookie } = require("./jwt");
const emailConfig = require("./config/emailConfig");

module.exports = {
  resetPasswordEmail,
  validationEmail,
  createCookie,
  verifyCookie,
};
