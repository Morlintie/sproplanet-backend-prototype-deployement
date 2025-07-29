const nodemailer = require("nodemailer");
const nodemailerConfig = require("./config/emailConfig");

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);
  await transporter.sendMail({
    from: "Morlintie <valinumvenenum@gmail.com>",
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
};

module.exports = sendEmail;
