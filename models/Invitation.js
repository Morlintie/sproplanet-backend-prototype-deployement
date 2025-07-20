const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    advert: {
      type: mongoose.Types.ObjectId,
      ref: "Advert",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: { type: String, enum: ["player", "goalkeeper"], default: "player" },
    message: { type: String, trim: true, maxlength: 250 },

    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "expired", "cancelled"],
      default: "pending",
    },

    seen: { type: Boolean, default: false },

    respondedAt: Date,
    isDeleted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

invitationSchema.index(
  { advert: 1, sender: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "accepted"] },
      isDeleted: false,
      archived: false,
    },
  }
);

/* auto-expire helper: cron can set status='expired'
   where createdAt is older than 6 h and status='pending' */

const Invitation = mongoose.model("Invitation", invitationSchema);

module.exports = Invitation;
