const express = require("express");
const {
  createAdvert,
  requestAdvert,
  acceptRequestAdvert,
  rejectRequestAdvert,
  getAllAdverts,
  getUserAdverts,
  getPerviousUserAdverts,
  getCurrentUserAdverts,
  getSingleAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,

  deleteAdvert,
  revokeRequestAdvert,

  leaveAdvert,
  expelFromAdvert,
} = require("../controllers/advertController");
const router = express.Router();

router.post("/", createAdvert);
router.post("/request/:id", requestAdvert);

router.get("/", getAllAdverts);
router.get("/user/:id", getUserAdverts);
router.get("/user/:id/previous", getPerviousUserAdverts);
router.get("/user/:id/current", getCurrentUserAdverts);
router.get("/:id", getSingleAdvert);

router.patch("/delete/:id", softDeleteAdvert);
router.patch("/request/accept/:id", acceptRequestAdvert);
router.patch("/request/reject/:id", rejectRequestAdvert);

router.patch("/cancel/:id", cancelAdvert);
router.patch("/:id", updateAdvert);

router.delete("/request/:id", revokeRequestAdvert);

router.delete("/leave/:id", leaveAdvert);
router.delete("/expel/:id", expelFromAdvert);
router.delete("/:id", deleteAdvert);

module.exports = router;
