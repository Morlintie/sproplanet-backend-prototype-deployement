const express = require("express");
const {
  createInvite,
  getUserInvites,
  getSingleInvite,
  revokeInvite,
  acceptInvite,
  rejectInvite,
  deleteInvite,
} = require("../controllers/InvitationController");
const router = express.Router();

router.post("/", createInvite);

router.get("/user/:id", getUserInvites);
router.get("/:id", getSingleInvite);

router.patch("/accept/:id", acceptInvite);
router.patch("/reject/:id", rejectInvite);
router.patch("/revoke/:id", revokeInvite);

router.delete("/:id", deleteInvite);

module.exports = router;
