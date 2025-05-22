const sendEmail = require("./email");

const resetPasswordEmail = async (to, name, code) => {
  const subject = "Password Reset";
  const text = `Hello ${name} 👋
  Here is your verification code ${code}`;
  const realCode = code.split("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verification Email</title>
    
  </head>
  <body
    style="
      font-family: Arial, Helvetica, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    "
  >
    <img
      style="
        width: 200px;

        height: 200px;
        object-fit: contain;
      "
      src="https://res.cloudinary.com/dppjlhdth/image/upload/v1745173480/20250416_1450_Green_Sports_Planet_remix_01jrz6wrsye9fbt932gj8vkhrs_kw090x.png"
      alt="logo"
    />
    <h4>Here's your verification code. Please don't share with anyone</h4>
    <main
      style="
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
      "
    >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[0]}</span
      >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[1]}</span
      >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[2]}</span
      >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[3]}</span
      >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[4]}</span
      >
      <span
        style="
          font-size: 1.3rem;
          border: 3px solid #16a303;
          padding: 3px 8px;
          border-radius: 3px;
          color: gray;
          margin-bottom: 10px;
        "
        >${realCode[5]}</span
      >
    </main>
    <footer style="font-size: 0.8rem; color: rgb(86, 86, 86)">
      SporYol, all rights reserverd &copy;
    </footer>
  </body>
</html>
`;

  return sendEmail(to, subject, text, html);
};

module.exports = resetPasswordEmail;
