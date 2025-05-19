const { verifyCookie } = require("../utils");

const passUserInfoMiddleware = async (req, res, next) => {
  req.user = verifyCookie(req, res);
  next();
};

module.exports = passUserInfoMiddleware;
