const resetPasswordEmail = require("./resetPasswordEmail");
const validationEmail = require("./validationEmail");
const deletionEmail = require("./deletionEmail");
const { createCookie, verifyCookie } = require("./jwt");
const {
  adminUserQuery,

  adminUserUpdateQuery,
} = require("./adminUserQuery");
const adminCompanyQuery = require("./adminCompanyQuery");
const updateCompanyEmail = require("./updateCompanyEmail");
const resetCompanyPasswordEmail = require("./resetCompanyPasswordEmail");
const pitchDeletionRequestEmail = require("./pitchDeletionRequestEmail");
const adminPitchQuery = require("./adminPitchQuery");

module.exports = {
  resetPasswordEmail,
  validationEmail,
  createCookie,
  verifyCookie,
  adminUserQuery,

  adminUserUpdateQuery,

  deletionEmail,
  adminCompanyQuery,
  updateCompanyEmail,
  resetCompanyPasswordEmail,
  pitchDeletionRequestEmail,
  adminPitchQuery,
};
