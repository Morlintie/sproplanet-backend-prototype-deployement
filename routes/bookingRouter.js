const express = require("express");
const router = express.Router();
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  createBooking,
  createBookingCompany,
  getUserBookings,
  getCompanyBookings,
  getSingleBooking,
  updateBooking,
  replyBooking,
  switchBooking,
  refundBooking,
  rejectBooking,
  deleteBooking,
} = require("../controllers/bookingController");

router.post("/", createBooking);
router.post("/company", createBookingCompany);

router.get("/", getUserBookings);
router.get("/company", getCompanyBookings);
router.get("/:id", getSingleBooking);

router.patch("/refund/:id", refundBooking);
router.patch("/reject/:id", rejectBooking);
router.patch("/reply/:id", replyBooking);
router.patch("/switch/:id", switchBooking);
router.patch("/:id", updateBooking);

router.delete("/:id", deleteBooking);

module.exports = router;
