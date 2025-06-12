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

router.get("/surrounding", getAllVicinityPitches);

router.get("/admin", getAdminPitches);

router.get("/companyUser", getCompanyUserPitches);

router.get("/companyUser:id", getCompanyUserPitch);

router.get("/companyUser/delete:id", deletionRequest);
router.get("/:id", passUserInfoMiddleware, getSinglePitch);

router.patch("/admin/update:id", updateAdminPitch);

router.patch("/companyUser/update", updateCompanyUserPitches);

router.patch("/companyUser/update:id", updateCompanyUserPitch);

router.delete("/admin/delete:id", deletePitch);

module.exports = router;
