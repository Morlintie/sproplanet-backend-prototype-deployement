const cron = require("node-cron");
const Booking = require("../models/Booking");

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
};

module.exports = setupCronJobs;
