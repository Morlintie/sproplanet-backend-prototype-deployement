const nodemailer = require("nodemailer");

const nodemailerConfig = {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "romaine.sawayn@ethereal.email",
    pass: "vjrBBMeBEwCdEFdf6Z",
  },
};

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
