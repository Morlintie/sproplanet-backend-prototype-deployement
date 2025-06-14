const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { BadRequestError } = require("../errors");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide username"],
      unique: [true, "This username has already been taken."],
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
        values: ["user", "admin", "companyOwner", "banned"],
        message: "Please provide a valid role",
      },
      required: [true, "Please provide a role"],
      default: "user",
    },
    phoneNumber: {
      type: Number,
      match: [/^\+?[\d\s\-().]{7,20}$/, "Please provide a valid phone number."],
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
      type: [
        {
          userId: mongoose.Types.ObjectId,
          name: String,
          email: String,
          role: String,
          age: Number,
          profilePicture: String,
          friends: [
            {
              userId: mongoose.Types.ObjectId,
              name: String,
              email: String,
              role: String,
              school: String,
              age: Number,
              profilePicture: String,
              goalKeeper: Boolean,
            },
          ],
          goalKeeper: Boolean,
        },
      ],
      default: [],
    },

    friendRequests: {
      type: [
        {
          userId: mongoose.Types.ObjectId,
          name: String,
          email: String,
          role: String,
          age: Number,
          profilePicture: String,
          friends: [
            {
              userId: mongoose.Types.ObjectId,
              name: String,
              email: String,
              role: String,
              school: String,
              age: Number,
              profilePicture: String,
              goalKeeper: Boolean,
            },
          ],
          goalKeeper: Boolean,
        },
      ],
      default: [],
    },
    friends: {
      type: [
        {
          userId: mongoose.Types.ObjectId,
          name: String,
          email: String,
          role: String,
          age: Number,
          profilePicture: String,
          friends: [
            {
              userId: mongoose.Types.ObjectId,
              name: String,
              email: String,
              role: String,
              school: String,
              age: Number,
              profilePicture: String,
              goalKeeper: Boolean,
            },
          ],
          goalKeeper: Boolean,
        },
      ],
      default: [],
    },
    recentlySearchedUser: {
      type: [
        {
          userId: mongoose.Types.ObjectId,
          name: String,
          email: String,
          role: {
            type: String,
            enum: {
              values: ["user", "admin", "companyOwner", "banned"],
              message: "Please provide a valid role value.",
            },
          },
          profilePicture: String,
          goalKeeper: Boolean,
        },
      ],
      default: [],
    },

    recentlySearchedPitch: {
      type: [
        { pitchId: mongoose.Types.ObjectId, name: String, rating: Number },
      ],
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
  },
  { timestamps: true }
);

userSchema.index({ name: "text" }, { default_language: "turkish" });

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

const User = mongoose.model("User", userSchema);

module.exports = User;
