const { verifyCookie } = require("../utils");
const { ForbiddenError } = require("../errors");

const adminMiddleware = async (req, res, next) => {
  const cookieUser = verifyCookie(req, res);
  if (!(cookieUser.role === "admin")) {
    throw new ForbiddenError("You are forbidden to perform that action.");
  }
  req.user = cookieUser;

  next();
};

module.exports = adminMiddleware;
