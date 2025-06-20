const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    pitch: {
      type: mongoose.Types.ObjectId,
      ref: "Pitch",
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Types.ObjectId,
      ref: "Company",
      required: true,
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
    photos: {
      type: [
        {
          url: { type: String, required: true, trim: true },
          publicId: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },

    replies: {
      type: [
        {
          user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
          comment: { type: String, trim: true, maxlength: 1000 },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
          isEdited: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    likes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    isVerified: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ pitch: 1, user: 1 }, { unique: true });

reviewSchema.index({ pitch: 1, rating: -1 });

reviewSchema.index({ user: 1, createdAt: -1 });

reviewSchema.statics.getAverageRating = async function (pitchId) {
  const result = await this.aggregate([
    { $match: { pitch: new mongoose.Types.ObjectId(pitchId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);
  await this.model("Pitch").findOneAndUpdate(
    { _id: pitchId },
    {
      "rating.averageRating":
        Math.ceil(result[0]?.averageRating * 10) / 10 || 0,
      "rating.totalReviews": result[0]?.totalReviews || 0,
    },
    { new: true, runValidators: true }
  );
};

reviewSchema.post("save", async function () {
  await this.constructor.getAverageRating(this.pitch);
});

reviewSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.pitch);
  }
});
reviewSchema.pre("updateMany", async function (next) {
  this._updatePayload = this.getUpdate();
  this._filterPayload = this.getFilter();
  next();
});

reviewSchema.post("updateMany", async function (result) {
  if (result.modifiedCount > 0) {
    if (this._updatePayload.$set.rating) {
      const pitchId = this._filterPayload.pitch;
      await this.model("Pitch").getAverageRating(pitchId);
    }
  }
});

reviewSchema.post("deleteOne", async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.pitch);
  }
});

reviewSchema.pre("deleteMany", async function (next) {
  this._updatePayload = this.getUpdate();
  this._filterPayload = this.getFilter();
  next();
});

reviewSchema.post("deleteMany", async function (result) {
  if (result.modifiedCount > 0) {
    if (this._updatePayload.$set.rating) {
      const pitchId = this._filterPayload.pitch;
      await this.model("Pitch").getAverageRating(pitchId);
    }
  }
});

const PitchReview = mongoose.model("PitchReview", reviewSchema);

module.exports = PitchReview;
