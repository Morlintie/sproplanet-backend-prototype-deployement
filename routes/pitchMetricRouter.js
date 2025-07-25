const express = require("express");
const {
  totalEarned,
  statusMetrics,
  pitchEarned,
  pitchStatusMetrics,
  previousStatusMetrics,
  previousTotalEarned,
  previousRefundedTotal,
  previousPitchStatusMetrics,
  previousPitchTotalEarned,
  previousPitchRefundedTotal,
  currentConfirmedBookings,
  currentPendingBookings,
  currentStatusMetrics,
  currentConfirmedPitchBookings,
  currentPendingPitchBookings,
  currentPitchStatusMetrics,
  averageCompanyRating,
  bestCustomers,
  datePercentage,
  datePercentagePitch,
} = require("../controllers/pitchMetricController");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get(
  "/total-earned/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  totalEarned
);

router.get(
  "/status/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  statusMetrics
);

router.get(
  "/pitch-earned/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  pitchEarned
);

router.get(
  "/pitch-status/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  pitchStatusMetrics
);

router.get(
  "/previous-metrics/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousStatusMetrics
);

router.get(
  "/previous-total-earned/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousTotalEarned
);

router.get(
  "/previous-refunded-total/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousRefundedTotal
);

router.get(
  "/pitch-previous-status-metrics/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousPitchStatusMetrics
);

router.get(
  "/pitch-previous-total-earned/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousPitchTotalEarned
);

router.get(
  "/pitch-previous-refunded-total/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  previousPitchRefundedTotal
);

router.get(
  "/current-confirmed-bookings/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentConfirmedBookings
);

router.get(
  "/current-pending-bookings/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentPendingBookings
);

router.get(
  "/current-status-metrics/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentStatusMetrics
);

router.get(
  "/current-confirmed-pitch-bookings/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentConfirmedPitchBookings
);

router.get(
  "/current-pending-pitch-bookings/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentPendingPitchBookings
);

router.get(
  "/current-pitch-status-metrics/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  currentPitchStatusMetrics
);

router.get(
  "/average-company-rating/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  averageCompanyRating
);

router.get(
  "/bestCustomers/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  bestCustomers
);

router.get(
  "/date-percentage/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  datePercentage
);

router.get(
  "/date-percentage-pitch/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "owner", "admin");
  },
  datePercentagePitch
);

module.exports = router;
