const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  register,
  login,
  logout,
  forgot,
  userVerification,
  resetPassword,
  checkPasswordCode,
  setGoogleCookie,
  registerCompany,
  loginCompany,
  forgotCompanyPassword,
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
router.get("/google/cookie", setGoogleCookie);

router.post(
  "/register/company",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  registerCompany
),
  router.post("/login/company", loginCompany);
router.post("/forgot/company", forgotCompanyPassword);

module.exports = router;
