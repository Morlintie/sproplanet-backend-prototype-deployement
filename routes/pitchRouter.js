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

router.post("/", createPitch);

router.get("/", getAllPitches);

router.get("/surrounding", getAllVicinityPitches);

router.get("/admin", getAdminPitches);

router.get("/companyUser", getCompanyUserPitches);

router.get("/companyUser:id", getCompanyUserPitch);

router.get("/companyUser/delete:id", deletionRequest);
router.get("/:id", getSinglePitch);

router.patch("/admin/update:id", updateAdminPitch);

router.patch("/companyUser/update", updateCompanyUserPitches);

router.patch("/companyUser/update:id", updateCompanyUserPitch);

router.delete("/admin/delete:id", deletePitch);

module.exports = router;
