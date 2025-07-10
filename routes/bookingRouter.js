const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createBooking,
  getPreviousUserBookings,
  getCurrentUserBookings,
  getCompanyBookings,
  getPreviousCompanyBookings,
  getCurrentCompanyBookings,
  getSingleBooking,
  updateBooking,
  replyBooking,
  switchBooking,
  refundBooking,
  rejectBooking,
  deleteBooking,
  payBooking,
} = require("../controllers/bookingController");

router.post("/", authenticationMiddleware, createBooking);

router.get("/", authenticationMiddleware, getCurrentUserBookings);
router.get("/previous", authenticationMiddleware, getPreviousUserBookings);
router.get(
  "/company/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "company", "admin");
  },
  getCompanyBookings
);
router.get(
  "/company/previous/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "company", "admin");
  },
  getPreviousCompanyBookings
);
router.get(
  "/company/current/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "company", "admin");
  },
  getCurrentCompanyBookings
);
router.get("/pay/:id", authenticationMiddleware, payBooking);
router.get("/:id", authenticationMiddleware, getSingleBooking);

router.patch("/refund/:id", refundBooking);
router.patch("/reject/:id", rejectBooking);
router.patch("/reply/:id", replyBooking);
router.patch("/switch/:id", switchBooking);
router.patch("/:id", updateBooking);

router.delete("/:id", deleteBooking);

module.exports = router;
