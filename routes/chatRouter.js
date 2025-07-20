const express = require("express");
const {
  sendMessage,
  getMessages,
  getUnseenMessages,
  getSingleMessage,
  softDeleteMessage,
  markMessageSeen,
  deleteMessage,
} = require("../controllers/chatController");
const router = express.Router();

router.post("/send", sendMessage);

router.get("/", getMessages);
router.get("/unread", getUnseenMessages);
router.get("/:id", getSingleMessage);

router.patch("/delete/:id", softDeleteMessage);
router.patch("/mark/:id", markMessageSeen);

router.delete("/delete/:id", deleteMessage);

module.exports = router;
