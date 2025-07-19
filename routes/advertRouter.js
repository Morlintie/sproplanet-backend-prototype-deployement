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
  inviteLinkAdvert,
  updateAdvert,
  softDeleteAdvert,
  cancelAdvert,
  markAdvertRequestSeen,
  deleteAdvert,
  revokeRequestAdvert,
  getVicinityAdverts,
  getParticipantAdverts,
  leaveAdvert,
  expelFromAdvert,
  addAdminToAdvert,
  removeAdminFromAdvert,
  getWaitingListAdverts,
} = require("../controllers/advertController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const passUserInfoMiddleware = require("../middlewares/passUserInfoMiddleware");
const router = express.Router();

router.post("/", authenticationMiddleware, createAdvert);
router.post("/request/:id", authenticationMiddleware, requestAdvert);

router.get("/", passUserInfoMiddleware, getAllAdverts);
router.get("/vicinity", passUserInfoMiddleware, getVicinityAdverts);
router.get("/user/:id", authenticationMiddleware, getUserAdverts);
router.get(
  "/user/:id/previous",
  authenticationMiddleware,
  getPerviousUserAdverts
);
router.get(
  "/user/:id/current",
  authenticationMiddleware,
  getCurrentUserAdverts
);
router.get("/participant", authenticationMiddleware, getParticipantAdverts);
router.get("/waiting-list", authenticationMiddleware, getWaitingListAdverts);
router.get("/invite/:id", authenticationMiddleware, inviteLinkAdvert);
router.get("/:id", passUserInfoMiddleware, getSingleAdvert);

router.patch("/delete/:id", authenticationMiddleware, softDeleteAdvert);
router.patch(
  "/request/accept/:id",
  authenticationMiddleware,
  acceptRequestAdvert
);
router.patch(
  "/request/reject/:id",
  authenticationMiddleware,
  rejectRequestAdvert
);
router.patch(
  "/request/seen/:id",
  authenticationMiddleware,
  markAdvertRequestSeen
);
router.patch("/cancel/:id", authenticationMiddleware, cancelAdvert);
router.patch("/admin/add/:id", authenticationMiddleware, addAdminToAdvert);
router.patch(
  "/admin/remove/:id",
  authenticationMiddleware,
  removeAdminFromAdvert
);

router.patch("/:id", authenticationMiddleware, updateAdvert);

router.delete("/request/:id", authenticationMiddleware, revokeRequestAdvert);

router.delete("/leave/:id", authenticationMiddleware, leaveAdvert);
router.delete("/expel/:id", authenticationMiddleware, expelFromAdvert);
router.delete(
  "/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteAdvert
);

module.exports = router;
