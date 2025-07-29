const mongoose = require("mongoose");
const { BadRequestError } = require("../errors");
const AdvertChatMessage = require("./AdvertChat");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
); // User stucturı aşşağıda kullanılacak

/** pitch booked on another platform */

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false }
); // Platform dışı rezervasyon sahası için fotoğraf yapısı "customPitchSchema" da kullanılacak

const customPitchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 250 },
    district: String,
    city: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number] },
    },
    photo: photoSchema,
  },
  { _id: false }
); // Platform dışı rezervasyon sahası için özel saha yapısı

const locationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number] },
  },
  { _id: false }
); // Konum yapısı, geospatial sorgular için kullanılacak

const addressSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, maxlength: 250 },
    district: String,
    city: String,
    location: locationSchema,
  },
  { _id: false }
); // adres yapısı

const waitingListSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    requestedAt: { type: Date, default: Date.now() },
    seen: { type: Boolean, default: false },
  },
  { _id: false }
); // Bekleme listesi yapısı, kullanıcı ve istek zamanı ile birlikte, aşşağıda kullanılacak

const matchAdvertSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: { type: String, trim: true, required: true, maxlength: 100 }, // halısahanın adı
    startsAt: { type: Date, required: true }, // ne zaman başlıyor

    pitch: { type: mongoose.Types.ObjectId, ref: "Pitch" }, // ← internal booking
    customPitch: customPitchSchema,
    address: addressSchema, // ← external booking
    booking: { type: mongoose.Types.ObjectId, ref: "Booking" }, // hangi rezervasyonla ilişkili (eğer platfomr içi ise)

    playersNeeded: {
      type: Number,
      min: 1,

      required: true,
    },
    goalKeepersNeeded: {
      type: Number,
      min: 0,

      default: 0,
    },
    participants: { type: [participantSchema], default: [] }, // Katılımcılar
    waitingList: { type: [waitingListSchema], default: [] }, // Bekleme listesi

    notes: { type: String, trim: true, maxlength: 300 }, // Ek notlar
    status: {
      type: String,
      enum: ["open", "full", "cancelled", "expired", "completed"],
      default: "open",
    }, // Durum: açık, dolu, iptal edildi, süresi dolmuş, tamamlandı
    adminAdvert: { type: [mongoose.Types.ObjectId], ref: "User", default: [] }, // Adminler, whatapp grub adminler gibi
    isDeleted: {
      type: Boolean,
      default: false,
    }, // Silinmiş mi? (soft delete)
    archived: {
      type: Boolean,
      default: false,
    }, // Arşivlenmiş mi? (soft delete)
  },
  { timestamps: true }
);

matchAdvertSchema.pre("validate", function (next) {
  if (!!this.pitch === !!this.customPitch) {
    return next(
      new BadRequestError("Provide either pitch or customPitch, not both")
    );
  }
  if (
    this.playersNeeded + this.goalKeepersNeeded <= this.participants.length &&
    (this.status === "open" || this.status === "full")
  ) {
    this.status = "full";
  } else if (
    this.status === "full" &&
    this.playersNeeded + this.goalKeepersNeeded > this.participants.length
  ) {
    this.status = "open";
  }

  next();
});

matchAdvertSchema.virtual("openSlots").get(function () {
  return this.playersNeeded - this.participants.length;
});

matchAdvertSchema.index(
  { startsAt: 1, pitch: 1, createdBy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      archived: false,
      $or: [{ status: "open" }, { status: "full" }],
    },
  }
);

matchAdvertSchema.index({ startsAt: 1 });
matchAdvertSchema.index({ status: 1 });

matchAdvertSchema.index({ "address.location": "2dsphere" });

matchAdvertSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await AdvertChatMessage.deleteMany({ advert: doc._id });
  }
});

const Advert = mongoose.model("Advert", matchAdvertSchema);
module.exports = Advert;
