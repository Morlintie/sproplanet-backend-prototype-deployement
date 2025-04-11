const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const register = async (req, res) => {
  res.send("register");
};

const login = async (req, res) => {
  res.send("login");
};

const logout = async (req, res) => {
  res.send("logout");
};

const forgot = async (req, res) => {
  res.send("forgot");
};

module.exports = {
  register,
  login,
  logout,
  forgot,
};
