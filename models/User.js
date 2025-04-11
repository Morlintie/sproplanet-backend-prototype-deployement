const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide username."],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide user email."],
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

const User = mongoose.model("User", userSchema);

module.exports = User;
