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
  markAdvertRequestSeen,
  deleteAdvert,
  revokeRequestAdvert,
  getVicinityAdverts,

  leaveAdvert,
  expelFromAdvert,
} = require("../controllers/advertController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/", authenticationMiddleware, createAdvert);
router.post("/request/:id", authenticationMiddleware, requestAdvert);

router.get("/", authenticationMiddleware, getAllAdverts);
router.get("/vicinity", authenticationMiddleware, getVicinityAdverts);
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
router.get("/:id", authenticationMiddleware, getSingleAdvert);

router.patch("/delete/:id", softDeleteAdvert);
router.patch("/request/accept/:id", acceptRequestAdvert);
router.patch("/request/reject/:id", rejectRequestAdvert);
router.patch("/request/seen/:id", markAdvertRequestSeen);
router.patch("/cancel/:id", cancelAdvert);
router.patch("/:id", updateAdvert);

router.delete("/request/:id", revokeRequestAdvert);

router.delete("/leave/:id", leaveAdvert);
router.delete("/expel/:id", expelFromAdvert);
router.delete("/:id", deleteAdvert);

module.exports = router;
