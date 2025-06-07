const express = require("express");
const roleMiddleware = require("../middlewares/roleMiddleware");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const router = express.Router();
const {
  getManyCompany,
  getSingleCompany,
  showCompany,
  updateSingleCompany,
  requestPasswordReset,
  resetPasswordCompany,
  updateCompanyRequest,
} = require("../controllers/companyController");

router.get(
  "/getMany",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  getManyCompany
);
router.get(
  "/getSingle:id",
  authenticationMiddleware,
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  getSingleCompany
);
router.get(
  "/show",
  authenticationMiddleware,
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  showCompany
);

router.post(
  "/updateRequest",
  authenticationMiddleware,
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  updateCompanyRequest
);
router.patch(
  "/update:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  updateSingleCompany
);
router.post(
  "/passwordChange",
  authenticationMiddleware,
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  requestPasswordReset
);
router.patch(
  "/passwordReset:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  resetPasswordCompany
);

module.exports = router;
