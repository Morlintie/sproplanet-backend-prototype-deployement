const express = require("express");
const {
  createAdvert,
  requestAdvert,
  inviteToAdvert,
  getAllAdverts,
  getUserAdverts,
  getPerviousUserAdverts,
  getCurrentUserAdverts,
  getSingleAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,
  replyToRequestAdvert,
  replyToInviteAdvert,
  deleteAdvert,
  revokeRequestAdvert,
  revokeInviteAdvert,
  leaveAdvert,
  expelFromAdvert,
} = require("../controllers/advertController");
const router = express.Router();

router.post("/", createAdvert);
router.post("/request/:id", requestAdvert);
router.post("/invite/:id", inviteToAdvert);

router.get("/", getAllAdverts);
router.get("/user/:id", getUserAdverts);
router.get("/user/:id/previous", getPerviousUserAdverts);
router.get("/user/:id/current", getCurrentUserAdverts);
router.get("/:id", getSingleAdvert);

router.patch("/delete/:id", softDeleteAdvert);
router.patch("/reply/request/:id", replyToRequestAdvert);
router.patch("/reply/invite/:id", replyToInviteAdvert);
router.patch("/cancel/:id", cancelAdvert);
router.patch("/:id", updateAdvert);

router.delete("/request/:id", revokeRequestAdvert);
router.delete("/invite/:id", revokeInviteAdvert);
router.delete("/leave/:id", leaveAdvert);
router.delete("/expel/:id", expelFromAdvert);
router.delete("/:id", deleteAdvert);

module.exports = router;
