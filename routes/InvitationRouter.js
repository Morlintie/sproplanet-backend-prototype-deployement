const express = require("express");
const {
  createInvite,
  getUserInvites,
  getSendUserInvites,
  getSingleInvite,
  revokeInvite,
  acceptInvite,
  rejectInvite,
  deleteInvite,
  softDeleteInvite,
} = require("../controllers/InvitationController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/", authenticationMiddleware, createInvite);

router.get("/user/:id", authenticationMiddleware, getUserInvites);
router.get("/send/:id", authenticationMiddleware, getSendUserInvites);
router.get("/:id", authenticationMiddleware, getSingleInvite);

router.patch("/accept/:id", authenticationMiddleware, acceptInvite);
router.patch("/reject/:id", authenticationMiddleware, rejectInvite);
router.patch("/revoke/:id", authenticationMiddleware, revokeInvite);
router.patch("/soft-delete/:id", authenticationMiddleware, softDeleteInvite);

router.delete(
  "/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteInvite
);

module.exports = router;
