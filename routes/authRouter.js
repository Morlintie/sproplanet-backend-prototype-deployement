const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const {
  register,
  login,
  logout,
  forgot,
  userVerification,
  resetPassword,
  checkPasswordCode,

  takeGoogleInfo,
  authenticateGoogleInfo,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify", userVerification);
router.get("/logout", authenticationMiddleware, logout);
router.post("/forgot", forgot);
router.post("/check", checkPasswordCode);
router.patch("/reset/:id", resetPassword);
router.get("/google", takeGoogleInfo);
router.get("/google/callback", authenticateGoogleInfo);

module.exports = router;
