const resetPasswordEmail = require("./resetPasswordEmail");
const validationEmail = require("./validationEmail");
const { createCookie, verifyCookie } = require("./jwt");

module.exports = {
  resetPasswordEmail,
  validationEmail,
  createCookie,
  verifyCookie,
};
