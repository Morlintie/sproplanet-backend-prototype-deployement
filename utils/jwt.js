const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors");

const createCookie = (res, user, token) => {
  const accessTokenJWT = jwt.sign({ user }, process.env.JWT_SECRET);
  const tokenJWT = jwt.sign({ user, token }, process.env.JWT_SECRET);
  const fifteenMinute = 1000 * 60 * 15;
  const twoMonths = 1000 * 60 * 60 * 24 * 60;

  res.cookie("accessToken", accessTokenJWT, {
    httpOnly: true,
    signed: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + fifteenMinute),
  });

  res.cookie("refreshToken", tokenJWT, {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + twoMonths),
    signed: true,
  });
};

const verifyCookie = (req, res) => {
  try {
    const { accessToken, refreshToken } = req.signedCookies;
    if (accessToken) {
      const { user } = jwt.verify(accessToken, process.env.JWT_SECRET);

      return {
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
      };
    }

    if (refreshToken) {
      const { user, token } = jwt.verify(refreshToken, process.env.JWT_SECRET);

      createCookie(res, user, token);
      return {
        name: user.name,
        email: user.email,
        userId: user.userId,
        role: user.role,
      };
    }

    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  } catch (error) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
};

module.exports = {
  createCookie,

  verifyCookie,
};
