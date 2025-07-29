const cron = require("node-cron");
const Booking = require("../models/Booking");
const Invitation = require("../models/Invitation");

const setupCronJobs = async () => {
  // Every 15 minutes update bookings status
  cron.schedule("*/15 * * * *", async () => {
    const now = new Date();
    await Booking.updateMany(
      {
        start: { $lt: now },
        status: "confirmed",
      },
      {
        status: "completed",
      }
    );
    await Booking.updateMany(
      {
        start: { $lt: now },
        status: "pending",
      },
      {
        status: "cancelled",
        "cancel.at": now,
        "cancel.by": "687249212341e90765396fb7",
        "cancel.reason": "Booking was not confirmed in time.",
        cancelModel: "Company",
      }
    );
    console.log("Cron job executed: Booking statuses updated.");
  });

  cron.schedule("*/6 * * * *", async () => {
    const now = new Date();
    await Invitation.updateMany(
      {
        createdAt: { $lt: now - 1000 * 60 * 60 * 6 },
        status: "pending",
      },
      {
        status: "expired",
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    );
    console.log("Cron job executed: Invitation statuses updated.");
  });
};

module.exports = setupCronJobs;
