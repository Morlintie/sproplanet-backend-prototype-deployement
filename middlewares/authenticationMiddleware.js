const { verifyCookie } = require("../utils");

const authenticationMiddleware = async (req, res, next) => {
  const cookieUser = verifyCookie(req, res);
  if (cookieUser.role === "admin") {
    req.user = cookieUser;
    next();
  }

  req.user = cookieUser;
  next();
};

module.exports = authenticationMiddleware;
