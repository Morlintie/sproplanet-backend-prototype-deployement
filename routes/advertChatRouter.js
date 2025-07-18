const express = require("express");

const {
  sendMessage,
  getMessages,
  getUnseenMessages,
  updateMessage,
  softDeleteMessage,
  markMessageSeen,
  deleteMessage,
} = require("../controllers/advertChatController");
const router = express.Router();

router.post("/send", sendMessage);

router.get("/messages/:id", getMessages);
router.get("/unseen/:id", getUnseenMessages);

router.patch("/update/:id", updateMessage);
router.patch("/delete/:id", softDeleteMessage),
  router.patch("/mark/:id", markMessageSeen);

router.delete("/delete/:id", deleteMessage);

module.exports = router;
