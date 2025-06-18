const express = require("express");
const router = express.Router();
const {
  createPitch,
  getAllPitches,
  getAllVicinityPitches,
  getSinglePitch,
  getAdminPitches,
  getCompanyUserPitches,
  getCompanyUserPitch,
  deletionRequest,
  updateAdminPitch,
  updateCompanyUserPitches,
  updateCompanyUserPitch,
  deletePitch,
  insertImage,
  deleteImage,
} = require("../controllers/pitchController");

const roleMiddleware = require("../middlewares/roleMiddleware");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const passUserInfoMiddleware = require("../middlewares/passUserInfoMiddleware");

router.post(
  "/",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  createPitch
);

router.get("/", passUserInfoMiddleware, getAllPitches);

router.get("/surrounding", passUserInfoMiddleware, getAllVicinityPitches);

router.get(
  "/admin",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  getAdminPitches
);

router.get(
  "/companyUser",

  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },

  getCompanyUserPitches
);

router.get(
  "/companyUser:id",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  getCompanyUserPitch
);

router.get(
  "/companyUser/delete:id",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  deletionRequest
);
router.get("/:id", passUserInfoMiddleware, getSinglePitch);

router.patch(
  "/admin/update:id",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  updateAdminPitch
);

router.patch(
  "/companyUser/update",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  updateCompanyUserPitches
);

router.patch(
  "/companyUser/update:id",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  updateCompanyUserPitch
);
router.post(
  "/insertImage:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  insertImage
);
router.delete(
  "/deleteImage:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  deleteImage
);

router.delete(
  "/admin/delete:id",
  async (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deletePitch
);

module.exports = router;
