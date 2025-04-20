const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide username"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide user email"],
    unique: [true, "This email has already been taken."],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email."],
  },

  password: {
    type: String,
    required: [true, "Please provide user password"],
  },

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
  role: {
    type: String,
    enum: {
      values: ["user", "admin", "owner"],
      message: "Please provide a valid role",
    },
    required: [true, "Please provide a role"],
    default: "user",
  },

  school: {
    type: String,
  },

  age: {
    type: Number,
  },

  rateAmount: {
    type: Number,
    required: [true, "Please provide user rate amount."],
    default: 0,
  },

  averageRate: {
    type: Number,
    required: [true, "Please provide user average rate."],
    default: 0,
  },

  friends: {
    type: [mongoose.Types.ObjectId],
    default: [],
  },

  //previous matches?
});

userSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
