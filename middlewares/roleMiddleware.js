const { verifyCookie } = require("../utils");
const { ForbiddenError, UnauthorizedError } = require("../errors");

const roleMiddleware = async (req, res, next, ...role) => {
  try {
    const cookieUser = verifyCookie(req, res);
    if (cookieUser === "admin") {
      req.user = cookieUser;
      return next();
    }
    if (role.includes(cookieUser.role)) {
      req.user = cookieUser;
      return next();
    }
    next(new ForbiddenError("You are forbidden to perform that action."));
  } catch (err) {
    next(
      new UnauthorizedError("You are not authorized to perform that action.")
    );
  }
};

module.exports = roleMiddleware;
