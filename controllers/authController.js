const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { validationEmail, resetPasswordEmail } = require("../utils");
const { BadRequestError } = require("../errors");

const register = async (req, res) => {
  const code = String(Math.ceil(Math.random() * 999999));
  req.body.validationNumber = code;
  req.body.validationExpirationDate = new Date(Date.now() + 1000 * 60 * 5);
  const user = await User.create(req.body);
  await validationEmail(user.email, user.name, code);
  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Account successfully created!", email: user.email });
};

const userVerification = async (req, res) => {
  const { validationNumber, email } = req.body;
  if (!validationNumber || !email) {
    throw new BadRequestError("Please provide required data");
  }
  const user = await User.findOne({ email });
  if (user) {
    if (user.validationNumber === validationNumber) {
      if (user.validationExpirationDate > Date.now()) {
        await User.findOneAndUpdate(
          { email },
          {
            isValid: true,
            validationNumber: "",
            validationExpirationDate: null,
          },
          { runValidators: true, new: true }
        );
      }
    } else {
      throw new BadRequestError("Validation code does not match.");
    }
  }
  res.status(StatusCodes.OK).json({ msg: "Your account has been verified." });
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
  userVerification,
};
