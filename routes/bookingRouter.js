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
  cancelBookingUser,
} = require("../controllers/bookingController");

router.post("/", authenticationMiddleware, createBooking);

router.get("/", authenticationMiddleware, getCurrentUserBookings);
router.get("/previous", authenticationMiddleware, getPreviousUserBookings);
router.get(
  "/company/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  getCompanyBookings
);
router.get(
  "/company/previous/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  getPreviousCompanyBookings
);
router.get(
  "/company/current/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  getCurrentCompanyBookings
);
router.get("/pay/:id", authenticationMiddleware, payBooking);
router.get("/:id", authenticationMiddleware, getSingleBooking);

router.patch("/refund/:id", authenticationMiddleware, refundBooking);
router.patch(
  "/reject/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  rejectBooking
);
router.patch(
  "/reply/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  replyBooking
);
router.patch("/cancel/:id", authenticationMiddleware, cancelBookingUser);
router.patch(
  "/switch/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  switchBooking
);
router.patch("/:id", authenticationMiddleware, updateBooking);

router.delete(
  "/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteBooking
);

module.exports = router;
