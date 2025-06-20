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
  InsertVideo,
  deleteVideo,
  updateImage,
  updateVideo,
  insertTags,
  deleteTags,
  insertSearchKeywords,
  deleteSearchKeywords,
  insertAmenities,
  deleteAmenities,
} = require("../controllers/pitchController");

const roleMiddleware = require("../middlewares/roleMiddleware");

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

router.patch(
  "/updateImage:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  updateImage
);
router.patch(
  "/updateVideo:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  updateVideo
);
router.post(
  "/insertImage:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  insertImage
);
router.post(
  "/insertVideo:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  InsertVideo
);
router.post(
  "/insertTags:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  insertTags
);
router.post(
  "/insertSearchKeywords:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  insertSearchKeywords
);

router.post(
  "/insertAmenities:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  insertAmenities
);

router.delete(
  "/deleteVideo:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  deleteVideo
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
router.delete(
  "/deleteTags:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteTags
);
router.delete(
  "/deleteSearchKeywords:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteSearchKeywords
);
router.delete(
  "/deleteAmenities:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  deleteAmenities
);

module.exports = router;
