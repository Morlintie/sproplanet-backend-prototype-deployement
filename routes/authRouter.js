const express = require("express");
const router = express.Router();
const {
  register,
  login,
  logout,
  forgot,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot", forgot); //for forget the password

module.exports = router;
