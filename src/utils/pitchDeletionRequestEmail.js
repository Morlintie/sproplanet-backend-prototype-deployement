const sendEmail = require("./email");

const pitchDeletionRequestEmail = async (email, phone, name) => {
  const subject = "Pitch Deletion";
  const text = `The owner ${name} wants to delete one of the pitches of his own from the system. Please get contact with him immediately. Email:${email}`;

  const html = `<h1> The owner ${name} wants to delete one of the pitches of his own from the system. Please get contact with him immediately. </h1>
  <h3> Email: ${email} </h3>
  <h3> Phone: ${phone} </h3>
`;

  return sendEmail("sporplanet@gmail.com", subject, text, html);
};

module.exports = pitchDeletionRequestEmail;
