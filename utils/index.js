const resetPasswordEmail = require("./resetPasswordEmail");
const validationEmail = require("./validationEmail");
const deletionEmail = require("./deletionEmail");
const { createCookie, verifyCookie } = require("./jwt");
const {
  adminUserQuery,
  adminUserQueryObject,
  adminUserUpdateQuery,
  adminUpdateQueryObject,
} = require("./adminUserQuery");

module.exports = {
  resetPasswordEmail,
  validationEmail,
  createCookie,
  verifyCookie,
  adminUserQuery,
  adminUserQueryObject,
  adminUserUpdateQuery,
  adminUpdateQueryObject,
  deletionEmail,
};
