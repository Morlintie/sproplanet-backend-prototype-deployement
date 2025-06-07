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
const adminCompanyQuery = require("./adminCompanyQuery");
const updateCompanyEmail = require("./updateCompanyEmail");
const resetCompanyPasswordEmail = require("./resetCompanyPasswordEmail");

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
  adminCompanyQuery,
  updateCompanyEmail,
  resetCompanyPasswordEmail,
};
