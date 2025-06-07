const sendEmail = require("./email");

const resetCompanyPasswordEmail = async (email, phone, name) => {
  const subject = "Reset Password Request";
  const text = `The owner ${name} wants to reset his password of his company profile. Please get contact with him immediately to verify the changes. Email:${email}`;

  const html = `<h1> The owner ${name} wants to reset his password of his company profile. Please get contact with him immediately to very the changes. </h1>
  <h3> Email: ${email} </h3>
  <h3> Phone: ${phone} </h3>
`;

  return sendEmail("sporplanet@gmail.com", subject, text, html);
};

module.exports = resetCompanyPasswordEmail;
