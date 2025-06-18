const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    pitch: {
      type: mongoose.Types.ObjectId,
      ref: "Pitch",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      set: (v) => Math.round(v * 10) / 10,
    },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },
    photos: [
      {
        url: { type: String, required: true },
        caption: { type: String, trim: true, maxlength: 100 },
      },
    ],

    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    dislike: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ pitch: 1, user: 1 }, { unique: true });

reviewSchema.index({ pitch: 1, rating: -1 });

reviewSchema.index({ user: 1, createdAt: -1 });

const PitchReview = mongoose.model("PitchReview", reviewSchema);

module.exports = PitchReview;
