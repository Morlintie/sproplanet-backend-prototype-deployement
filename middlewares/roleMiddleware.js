const { verifyCookie } = require("../utils");
const { ForbiddenError } = require("../errors");

const roleMiddleware = async (req, res, next, ...role) => {
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
};

module.exports = roleMiddleware;
