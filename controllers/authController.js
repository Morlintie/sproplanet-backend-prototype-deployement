require("../utils/config/oauthConfig");
const User = require("../models/User");
const Token = require("../models/Token");
const Company = require("../models/Company");
const { StatusCodes } = require("http-status-codes");
const {
  validationEmail,
  resetPasswordEmail,
  createCookie,
} = require("../utils");
const {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} = require("../errors");

const crypto = require("crypto");

const passport = require("passport");

const register = async (req, res) => {
  const { name, email, password, backupPassword } = req.body;
  if (password !== backupPassword) {
    throw new BadRequestError("Both password have to match with each other.");
  }
  let code = 1;
  while (code < 100000 || code > 999999) {
    code = Math.ceil(Math.random() * 999999);
  }

  code = String(code);

  const validationExpirationDate = new Date(Date.now() + 1000 * 60 * 5);
  const user = await User.create({
    name,
    email,
    password,
    validationNumber: code,
    validationExpirationDate,
  });
  await validationEmail(user.email, user.name, code);
  res.status(StatusCodes.CREATED).json({
    msg: "Account successfully created! Please check your mailbox for verification code.",
    userId: user._id,
  });
};

const userVerification = async (req, res) => {
  const { validationNumber, userId } = req.body;
  if (!validationNumber || !userId) {
    throw new BadRequestError("Please provide required data.");
  }
  const user = await User.findOne({ _id: userId });
  if (user) {
    if (user.validationNumber === validationNumber) {
      if (user.validationExpirationDate > Date.now()) {
        await User.findOneAndUpdate(
          { _id: userId },
          {
            isValid: true,
            validationNumber: "",
            validationExpirationDate: null,
          },
          { runValidators: true, new: true }
        );
      } else {
        throw new BadRequestError("Verification code's date has been expired.");
      }
    } else {
      throw new BadRequestError("Validation code does not match.");
    }
  }
  res.status(StatusCodes.OK).json({ msg: "Your account has been verified." });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    if (user.role === "banned") {
      throw new ForbiddenError(
        "You have been banned, please get contact with our customer service."
      );
    }

    if (user.isDeleted) {
      throw new NotFoundError("User couldn't found.");
    }

    const isUserVerified = user.isValid;
    if (!isUserVerified) {
      throw new UnauthorizedError("Your account haven't been verified yet.");
    }

    if (!user.googleId) {
      const isPasswordCorrect = await user.comparePassword(password);
      if (!isPasswordCorrect) {
        throw new UnauthorizedError("The password is not correct.");
      }
    }
    const cookieUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      userId: user._id,
    };

    let refreshToken = await Token.findOne({ user: user._id });

    if (!refreshToken) {
      const prevToken = crypto.randomBytes(16).toString("hex");
      const token = crypto.createHash("sha256").update(prevToken).digest("hex");
      refreshToken = await Token.create({ token, user: user._id });
    }

    createCookie(res, cookieUser, refreshToken);
  }

  res.status(StatusCodes.OK).json({ msg: "Login successful." });
};

const logout = async (req, res) => {
  res.cookie("accessToken", "logout access token", {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });

  res.cookie("refreshToken", "logout token", {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });

  await Token.findOneAndDelete({ user: req.user.userId });

  res.status(StatusCodes.OK).json({ msg: "Logout successful." });
};

const forgot = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    if (user.role === "banned") {
      throw new ForbiddenError(
        "You have been banned, please get contact with our customer service."
      );
    }

    if (user.isDeleted) {
      throw new NotFoundError("User couldn't found.");
    }

    const isUserValid = user.isValid;
    if (!isUserValid) {
      throw new UnauthorizedError("Your account haven't been verified yet.");
    }
    let code = 1;
    while (code < 100000 || code > 999999) {
      code = Math.ceil(Math.random() * 999999);
    }

    code = String(code);

    const fiveMinutes = 1000 * 60 * 5;
    const passwordExpirationDate = new Date(Date.now() + fiveMinutes);
    await User.findOneAndUpdate(
      { _id: user._id },
      { passwordNumber: code, passwordExpirationDate }
    );
    await resetPasswordEmail(user.email, user.name, code);
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: "Your verification email has been sent.", userId: user._id });
};

const checkPasswordCode = async (req, res) => {
  const { code, userId } = req.body;
  if (!code || !userId) {
    throw new BadRequestError("Please provide required data.");
  }

  const user = await User.findOne({ _id: userId });

  if (user) {
    if (user.role === "banned") {
      throw new ForbiddenError(
        "You have been banned, please get contact with our customer service."
      );
    }

    if (user.isDeleted) {
      throw new NotFoundError("User couldn't found.");
    }

    const isUserValid = user.isValid;
    if (!isUserValid) {
      throw new UnauthorizedError("Your account haven't been verified yet.");
    }
    if (code === user.passwordNumber) {
      if (user.passwordExpirationDate > Date.now()) {
        await User.findOneAndUpdate(
          { _id: userId },
          { passwordNumber: "", passwordExpirationDate: null },
          { new: true, runValidators: true }
        );
        res.status(StatusCodes.OK).json({ param: user._id });
      } else {
        throw new UnauthorizedError(
          "Your are not authorized to perform that action."
        );
      }
    } else {
      throw new UnauthorizedError(
        "You are not authorized to perform that action."
      );
    }
  }
};

const resetPassword = async (req, res) => {
  const { newPassword, newPasswordBackup } = req.body;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }

  const user = await User.findOne({ _id: id });

  if (user) {
    if (user.role === "banned") {
      throw new ForbiddenError(
        "You have been banned, please get contact with our customer service."
      );
    }

    if (user.isDeleted) {
      throw new NotFoundError("User couldn't found.");
    }

    const isUserValid = user.isValid;
    if (!isUserValid) {
      throw new UnauthorizedError("Your account haven't been verified yet.");
    }

    if (!newPassword || !newPasswordBackup) {
      throw new BadRequestError("Please provide all requested data.");
    }

    if (!(newPassword === newPasswordBackup)) {
      throw new BadRequestError(
        "Both passwords have to match with each other."
      );
    }
    const isPasswordMatch = await user.comparePassword(newPassword);
    if (isPasswordMatch) {
      throw new BadRequestError("New password cannot be same as old password.");
    }
    await User.findOneAndUpdate(
      { _id: id },
      { password: newPassword },
      { new: true, runValidators: true, timestamps: true }
    );
  }
  res
    .status(StatusCodes.OK)
    .json({ msg: "Your password has been successfully changed" });
};

const takeGoogleInfo = passport.authenticate("google", {
  scope: ["email", "profile"],
});
const authenticateGoogleInfo = [
  passport.authenticate("google", {
    failureRedirect: `${process.env.ORIGIN_FRONTEND}/auth/googleFailure`,
    session: false,
  }),

  async (req, res) => {
    if (req.user?.cause?.code === 11000) {
      res.redirect(
        `${process.env.ORIGIN_FRONTEND}/auth/signup?statusCode=409&message=${req.user.message}`
      );
    }
    if (req.user?.statusCode === 404) {
      res.redirect(
        `${process.env.ORIGIN_FRONTEND}/auth/login?statusCode=404&message=${req.user.message}`
      );
    }
    if (req.user?.signGoogle) {
      let code = 1;
      while (code < 100000 || code > 999999) {
        code = Math.ceil(Math.random() * 999999);
      }

      code = String(code);
      const fiveMinutes = 1000 * 60 * 5;
      const validationExpirationDate = new Date(Date.now() + fiveMinutes);
      await User.findOneAndUpdate(
        { _id: req.user.userId },
        { validationExpirationDate, validationNumber: code },
        { new: true, runValidators: true }
      );
      await validationEmail(req.user.email, req.user.name, code);
      res.redirect(
        `${process.env.ORIGIN_FRONTEND}/auth/signup?userId=${req.user.userId}`
      );
    }

    const user = await User.findOne({ _id: req.user.userId });
    if (user) {
      if (user.role === "banned") {
        res.redirect(
          `${process.env.ORIGIN_FRONTEND}/auth/login?statusCode=403&message=You have been banned, please get contact with your customer service.`
        );
      }

      if (user.isDeleted) {
        res.redirect(
          `${process.env.ORIGIN_FRONTEND}/auth/login?statusCode=404&message=User couldn't found.`
        );
      }
      const isUserValid = user.isValid;
      if (!isUserValid) {
        res.redirect(
          `${process.env.ORIGIN_FRONTEND}/auth/login?statusCode=401&message=Your account haven't been verified yet.`
        );
      }

      res.redirect(
        `${process.env.ORIGIN_FRONTEND}/auth/login?userId=${user._id}`
      ); //Change this to frontend's home page when set up.
    }
  },
];

const setGoogleCookie = async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    throw new BadRequestError("Please provide required data.");
  }
  const user = await User.findOne({ _id: userId });
  const cookieUser = {
    name: user.name,
    email: user.email,
    role: user.role,
    userId: user._id,
  };

  let refreshToken = await Token.findOne({ user: user._id });

  if (!refreshToken) {
    const prevToken = crypto.randomBytes(16).toString("hex");
    const token = crypto.createHash("sha256").update(prevToken).digest("hex");
    refreshToken = await Token.create({ token, user: user._id });
  }

  createCookie(res, cookieUser, refreshToken);
  res.status(StatusCodes.OK).json({ msg: "Login successful." });
};

registerCompany = async (req, res) => {
  const {
    name,
    email,
    phone,
    address,
    description,
    owner,
    ip,
    password,
    backupPassword,

    taxLocation,
    VKN_TCKN,
    type,
    postalCode,
  } = req.body;
  let { website, logo } = req.body;
  if (!website) {
    website = null;
  }
  if (!logo) {
    logo = null;
  }

  if (password !== backupPassword) {
    throw new BadRequestError("Both password have to match with each other.");
  }
  const company = await Company.create({
    name,
    email,
    phone,
    address,
    website,
    description,
    logo,
    owner,
    ip,
    password,

    taxLocation,
    VKN_TCKN,
    type,
    postalCode,
  });

  res.status(StatusCodes.CREATED).json({ company });
};
const loginCompany = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  console.log(ip);
  if (!email || !password) {
    throw new BadRequestError("Please provide all required data.");
  }
  const company = await Company.findOne({ email });

  if (!company) {
    throw new NotFoundError("Company not found.");
  }

  const isPasswordCorrect = await company.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthorizedError("The password is not correct.");
  }
  if (company.ip !== ip) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action from this IP address."
    );
  }
  const cookieCompany = {
    name: company.name,
    email: company.email,
    companyId: company._id,
    owner: company.owner,
    phone: company.phone,
    website: company.website,
    role: company.role,
  };
  const token = crypto.randomBytes(16).toString("hex");
  const refreshToken = crypto.createHash("sha256").update(token).digest("hex");
  createCookie(res, cookieCompany, refreshToken);

  res.status(StatusCodes.OK).json({ msg: "Login successful." });
};
module.exports = {
  register,
  login,
  logout,
  forgot,
  userVerification,
  checkPasswordCode,
  resetPassword,
  setGoogleCookie,
  registerCompany,
  loginCompany,
  takeGoogleInfo,
  authenticateGoogleInfo,
};
