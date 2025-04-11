const nodemailer = require("nodemailer");

const nodemailerConfig = {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "	fidel.jones@ethereal.email",
    pass: "	HBZhAb15322yrgjFN9",
  },
};

const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport(nodemailerConfig);
  await transporter.sendEmail({
    from: "Morlintie <valinumvenenum@gmail.com>",
    to: to,
    subject: subject,
    text: text,
    html: html,
  });
};

module.exports = sendEmail;
