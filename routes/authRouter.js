const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  forgot,
  userVerification,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/verify", userVerification);
router.get("/logout", logout);
router.post("/forgot", forgot); //for forget the password

module.exports = router;
