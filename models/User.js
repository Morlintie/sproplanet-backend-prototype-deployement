const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const locationSchema = new mongoose.Schema({
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
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide username"],
    },
    email: {
      type: String,
      required: [true, "Please provide user email"],
      unique: [true, "This email has already been taken."],
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
        values: ["user", "admin", "owner", "banned"],
        message: "Please provide a valid role",
      },
      required: [true, "Please provide a role"],
      default: "user",
    },
    phoneNumber: {
      type: Number,
      match: /^\+?[\d\s\-().]{7,20}$/,
      unique: [true, "This phone number has already been taken."],
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
      type: [mongoose.Types.ObjectId],
      default: [],
    },

    friendRequests: {
      type: [mongoose.Types.ObjectId],
      default: [],
    },
    friends: {
      type: [mongoose.Types.ObjectId],
      default: [],
    },
    recentlySearchedUser: {
      type: [mongoose.Types.ObjectId],
      default: [],
    },

    location: {
      type: locationSchema,
    },
    goalKeeper: {
      type: Boolean,
      required: [true, "Please provide a keeper status"],
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.index({ name: "text" }, { default_language: "turkish" });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  if (this.getUpdate().password) {
    const salt = await bcrypt.genSalt(10);
    this.getUpdate().password = await bcrypt.hash(
      this.getUpdate().password,
      salt
    );
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const passwordValid = await bcrypt.compare(candidatePassword, this.password);
  return passwordValid;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
