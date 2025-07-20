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
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/send/:id", authenticationMiddleware, sendMessage);

router.get("/chat/:id", authenticationMiddleware, getMessages);
router.get("/unseen", authenticationMiddleware, getUnseenMessages);
router.get("/:id", authenticationMiddleware, getSingleMessage);

router.patch("/delete/:id", authenticationMiddleware, softDeleteMessage);
router.patch("/mark/:id", authenticationMiddleware, markMessageSeen);

router.delete(
  "/delete/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteMessage
);

module.exports = router;
