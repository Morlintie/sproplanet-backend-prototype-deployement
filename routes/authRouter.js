const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  forgot,
  userVerification,
  resetPassword,
  checkPasswordCode,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify", userVerification);
router.get("/logout", logout);
router.post("/forgot", forgot);
router.post("/check", checkPasswordCode);
router.post("/reset/:id", resetPassword);

module.exports = router;
