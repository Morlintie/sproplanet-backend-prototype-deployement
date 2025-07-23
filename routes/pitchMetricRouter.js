const express = require("express");
const {
  totalEarned,
  statusMetrics,
  pitchEarned,
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

module.exports = router;
