const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Token = require("./Token");

const { BadRequestError } = require("../errors");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide username"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Please provide user email"],
      unique: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email."],
    },

    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        "Please provide user password.",
      ],
    },

    googleId: { type: String },

    validationNumber: {
      type: String,
    },

    validationExpirationDate: {
      type: Date,
    },

    isValid: {
      type: Boolean,
      required: [true, "User status must be provided."],
      default: false,
    },

    passwordNumber: {
      type: String,
    },
    passwordExpirationDate: {
      type: Date,
    },

    deleteNumber: {
      type: String,
    },
    deleteExpirationDate: {
      type: Date,
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "companyOwner", "banned"],
        message: "Please provide a valid role",
      },
      required: [true, "Please provide a role"],
      default: "user",
    },
    phoneNumber: {
      type: Number,
      match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number."],
      unique: true,
    },

    description: {
      type: String,
    },

    archived: {
      type: Boolean,
      required: [true, "Please provide an archive status."],
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    school: {
      type: String,
    },

    age: {
      type: Number,
      min: [0, "Age cannot be a negative value"],
    },

    profilePicture: {
      type: String,
    }, // design default PPs

    selfFriendRequests: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      default: [],
    },

    friendRequests: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      default: [],
    },
    friends: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      default: [],
    },
    recentlySearchedUser: {
      type: [{ type: mongoose.Types.ObjectId, ref: "User" }],
      default: [],
    },

    recentlySearchedPitch: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Pitch" }],
      default: [],
    },

    location: {
      city: {
        type: String,
        enum: {
          values: ["İstanbul"],
          message: "Please provide a valid city.",
        },
      },
      district: {
        type: String,
      },
    },
    goalKeeper: {
      type: Boolean,
      required: [true, "Please provide a keeper status"],
      default: false,
    },
    favoritePitches: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Pitch", default: [] }],
    }, // In the future an algorithm that makes the pitches suggested more for the users.
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);

      this.password = await bcrypt.hash(this.password, salt);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

userSchema.pre("findOneAndUpdate", async function (next) {
  try {
    if (this.getUpdate().password) {
      const salt = await bcrypt.genSalt(10);
      this.getUpdate().password = await bcrypt.hash(
        this.getUpdate().password,
        salt
      );
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

userSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await User.updateMany(
      {
        $or: [
          { friends: doc._id },
          { selfFriendRequests: doc._id },
          { friendRequests: doc._id },
          { recentlySearchedUser: doc._id },
        ],
      },
      {
        $pull: {
          friends: doc._id,
          selfFriendRequests: doc._id,
          friendRequests: doc._id,
          recentlySearchedUser: doc._id,
        },
      }
    );
    await Token.findOneAndDelete({ user: doc._id });
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const passwordValid = await bcrypt.compare(
      candidatePassword,
      this.password
    );
    return passwordValid;
  } catch (err) {
    console.log(err);
    throw new BadRequestError("Password comparison failed.");
  }
};

userSchema.virtual("bookings", {
  ref: "Booking",
  localField: "_id",
  foreignField: "bookedBy",
  justOne: false,
  options: { sort: { createdAt: -1 } },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
