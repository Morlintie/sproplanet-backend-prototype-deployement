const { verifyCookie } = require("../utils");

const authenticationMiddleware = async (req, res, next) => {
  req.user = verifyCookie(req, res);

  next();
};

module.exports = authenticationMiddleware;
