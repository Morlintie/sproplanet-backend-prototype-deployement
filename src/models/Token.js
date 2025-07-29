const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Please provide token value."],
  },

  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: [true, "Please provide associated user with this token."],
  },
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
