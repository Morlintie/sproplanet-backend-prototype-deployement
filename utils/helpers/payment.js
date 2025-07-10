const crypto = require("crypto");

const paymentHelper = ({ amount, currency }) => {
  const intent = crypto.randomBytes(16).toString("hex");
  return String(intent);
};

module.exports = paymentHelper;
