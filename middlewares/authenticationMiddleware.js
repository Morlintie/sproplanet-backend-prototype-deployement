const { verifyCookie } = require("../utils");
const { ForbiddenError, UnauthorizedError } = require("../errors");

const authenticationMiddleware = async (req, res, next) => {
  try {
    const cookieUser = verifyCookie(req, res);
    if (cookieUser.role === "banned") {
      throw new ForbiddenError(
        "You have been banned, please get contact with our customer service."
      );
    }
    if (cookieUser.role === "admin") {
      req.user = cookieUser;
      return next();
    }

    req.user = cookieUser;
    next();
  } catch (err) {
    next(
      new UnauthorizedError("Your session has expired, please login again.")
    );
  }
};

module.exports = authenticationMiddleware;
