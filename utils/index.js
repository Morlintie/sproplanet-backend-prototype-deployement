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
const {
  adminPitchReviewQuery,
  adminPitchReviewUpdateQuery,
} = require("./adminPitchReviewQuery");
const paymentHelper = require("./helpers/payment");
const { middlemanTax, pitchTax } = require("./taxes");
const dateToIso = require("./dateToIso");
const companyBookingQuery = require("./companyBookingQuery");

module.exports = {
  resetPasswordEmail,
  validationEmail,
  createCookie,
  verifyCookie,
  adminUserQuery,
  adminPitchReviewQuery,
  adminUserUpdateQuery,
  adminPitchReviewUpdateQuery,
  deletionEmail,
  adminCompanyQuery,
  updateCompanyEmail,
  resetCompanyPasswordEmail,
  pitchDeletionRequestEmail,
  adminPitchQuery,
  paymentHelper,
  middlemanTax,
  pitchTax,
  dateToIso,
  companyBookingQuery,
};
