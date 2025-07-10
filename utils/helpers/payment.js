const crypto = require("crypto");

const paymentHelper = async ({ amount, currency }) => {
  const intent = crypto.randomBytes(16).toString("hex");
  return intent;
};

module.exports = paymentHelper;
