const sendEmail = require("./email");

const updateCompanyEmail = async (email, phone, name) => {
  const subject = "Update Request";
  const text = `The owner ${name} wants to update some information in his company profile. Please get contact with him to verify the changes. Email:${email}`;

  const html = `<h1> The owner ${name} wants to update some information in his company profile. Please get contact with him to very the changes. </h1>
  <h3> Email: ${email} </h3>
  <h3> Phone: ${phone} </h3>
`;

  return sendEmail("sporplanet@gmail.com", subject, text, html);
};

module.exports = updateCompanyEmail;
