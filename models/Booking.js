const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "TRY" },
    multiplier: { type: Number, default: 1, min: 1 }, // weekend / holiday
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    middlemanShare: { type: Number, default: 0, min: 0 },
    middlemanTax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paid: { type: Boolean, default: false },
    method: {
      type: String,
      enum: ["card", "wallet", "cash", "transfer"],
      default: "card",
    },
    txId: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    pitch: {
      type: mongoose.Types.ObjectId,
      ref: "Pitch",
      required: true,
    },
    company: { type: mongoose.Types.ObjectId, ref: "Company", required: true },
    bookedBy: { type: mongoose.Types.ObjectId, ref: "User", required: true }, // whoever pays

    start: { type: Date, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    cancel: {
      at: Date,
      by: { type: mongoose.Types.ObjectId, ref: "User" },
      reason: { type: String, trim: true, maxlength: 240 },
    },

    totalPlayers: { type: Number, required: true, min: 2, max: 22 },

    price: priceSchema,

    notes: { type: String, trim: true, maxlength: 500 }, // optional free-text
  },
  { timestamps: true }
);

/* unique overlap check: same pitch, overlapping time, still active */
bookingSchema.index(
  { pitch: 1, start: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
