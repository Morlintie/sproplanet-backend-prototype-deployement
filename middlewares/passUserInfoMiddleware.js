const { UnauthorizedError } = require("../errors");

const jwt = require("jsonwebtoken");

const passUserInfoMiddleware = async (req, res, next) => {
  try {
    const { refreshToken, accessToken } = req.signedCookies;

    if (accessToken) {
      const { user } = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = {
        name: user.name,
        role: user.role,
        userId: user._id,
        email: user.email,
      };
      return next();
    }
    if (refreshToken) {
      const { user, token } = jwt.verify(refreshToken, process.env.JWT_SECRET);
      req.user = {
        name: user.name,
        role: user.role,
        userId: user._id,
        email: user.email,
      };
      createCookie(res, user, token);
      return next();
    }

    next();
  } catch (err) {
    throw new UnauthorizedError(
      "You are not authorized to preform that action."
    );
  }
};

module.exports = passUserInfoMiddleware;
