const mongoose = require("mongoose");
const { StatusCodes, METHOD_NOT_ALLOWED } = require("http-status-codes");
const User = require("../models/User");
const {
  adminUserQuery,
  adminUserUpdateQuery,
  adminUpdateQueryObject,
  resetPasswordEmail,
} = require("../utils");
const {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../errors");

const getManyUser = async (req, res) => {
  const role = req?.user?.role;

  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }

  if (role === "user" || role === "owner" || !role) {
    const userSearch = req.body.search;
    const userPage = req.body.page;

    const userLimit = 100;
    const userSkip = (userPage - 1) * userLimit;
    const userSelectedFields =
      "name email role school age profilePicture friends goalKeeper location createdAt _id";
    const users = await User.find({
      name: { $regex: userSearch, $options: "i" },
      isDeleted: false,
    })
      .select(userSelectedFields)
      .sort("name")
      .limit(userLimit)
      .skip(userSkip);

    res.status(StatusCodes.OK).json({ users });
  }

  if (role === "admin") {
    const users = await adminUserQuery(req);

    res.status(StatusCodes.OK).json({ users: users });
  }
};

const getSingleUser = async (req, res) => {
  const role = req?.user?.role;
  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }

  if (role === "user" || role === "owner" || !role) {
    const userSelectedFields =
      "name email role school age profilePicture friends goalKeeper location createdAt _id";
    const user = await User.findOne({ _id: id, isDeleted: false }).select(
      userSelectedFields
    );
    if (!user) {
      throw new NotFoundError("User couldn't found.");
    }
    res.status(StatusCodes.OK).json({ user });
  }
  if (role === "admin") {
    console.log(id);
    const user = await User.findOne({ _id: id }).select("-password");
    if (!user) {
      throw new NotFoundError("User couldn't found.");
    }
    res.status(StatusCodes.OK).json({ user });
  }
};

const showUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findOne({ _id: userId, isDeleted: false }).select(
    "-password"
  );
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }

  res.status(StatusCodes.OK).json({ user });
};

const getManyGoalkeeper = async (req, res) => {
  const role = req?.user?.role;

  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }

  if (role === "user" || role === "owner" || !role) {
    const userSearch = req.body.search;
    const userPage = req.body.page;

    const userLimit = 100;
    const userSkip = (userPage - 1) * userLimit;
    const userSelectedFields =
      "name email role school age profilePicture friends goalKeeper location createdAt _id";
    const users = await User.find({
      user: { $regex: userSearch },
      isDeleted: false,
      goalKeeper: true,
    })
      .select(userSelectedFields)
      .sort("name")
      .limit(userLimit)
      .skip(userSkip);

    res.status(StatusCodes.OK).json({ users });
  }
};

const getByGoogleId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }

  const user = await User.findOne({ googleId: id }).select("-password");

  if (!user) {
    throw NotFoundError("User couldn't found.");
  }

  res.status(StatusCodes.OK).json({ user });
};

const sendFriendRequest = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }

  const sendUser = await User.findOne({ _id: id }).select("-password");
  if (!sendUser) {
    throw new NotFoundError("User couldn't found.");
  }

  if (sendUser.friendRequests.includes(userId)) {
    throw new BadRequestError(
      "You have already sent friend request for that person."
    );
  }

  await User.findOneAndUpdate(
    { _id: id },
    { $addToSet: { friendRequests: new mongoose.Types.ObjectId(userId) } },
    { new: true, runValidators: true, timestamps: false }
  );
  const friendRequest = await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { selfFriendRequests: new mongoose.Types.ObjectId(id) } },
    { new: true, runValidators: true, timestamps: false }
  ).select("selfFriendRequests");

  res.status(StatusCodes.CREATED).json({ friendRequests: friendRequest });
};

const updateManyUser = async (req, res) => {
  const newUsers = await adminUserUpdateQuery(req);
  res.status(StatusCodes.OK).json({ users: newUsers });
};

const updateSingleUser = async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }
  if (role === "user" || role === "owner") {
    const { userId } = req.user;
    const { name, email, school, age, profilePicture, location } = req.body;
    const userSelectedFields =
      "name email role school age profilePicture friends goalKeeper location createdAt _id";
    const newUser = await User.findOneAndUpdate(
      { _id: userId },
      { name, email, school, age, profilePicture, location },
      { new: true, runValidators: true, timestamps: true }
    ).select(userSelectedFields);
    if (!newUser) {
      throw new NotFoundError("User couldn't found.");
    }
    res.status(StatusCodes.OK).json({ user: newUser });
  }
  if (role === "admin") {
    const updateObject = adminUpdateQueryObject(req);
    const newUser = await User.findOneAndUpdate({ _id: id }, updateObject, {
      new: true,
      runValidators: true,
      timestamps: true,
    }).select("-password");
    if (!newUser) {
      throw new NotFoundError("User couldn't found.");
    }
    res.status(StatusCodes.OK).json({ user: newUser });
  }
};

const updatePasswordUser = async (req, res) => {
  const { id } = req.params;
  const { newPassword, backupNewPassword } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide user credentials");
  }
  if (!newPassword || !backupNewPassword) {
    throw new BadRequestError("Please provide all requested data.");
  }
  if (!(newPassword === backupNewPassword)) {
    throw new BadRequestError("Both passwords have to match with each other.");
  }
  const user = await User.findOneAndUpdate(
    { _id: id },
    { password: newPassword },
    { new: true, runValidators: true, timestamps: true }
  );
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }
  req.status(StatusCodes.OK).json({ user });
};

const requestPasswordChange = async (req, res) => {
  const { userId } = req.user;
  const { password } = req.body;
  const oldUser = await User.findOne({ _id: userId });
  if (!oldUser) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!oldUser.comparePassword(password)) {
    throw new UnauthorizedError("Passwords are not match");
  }
  let code = 1;
  while (code < 100000 || code > 999999) {
    code = Math.ceil(Math.random() * 999999);
  }

  code = String(code);
  const fiveMinutes = new Date(Date.now() + 1000 * 60 * 5);

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { passwordNumber: code, passwordExpirationDate: fiveMinutes },
    { new: true, runValidators: true, timestamps: false }
  );
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }
  await resetPasswordEmail(user.email, user.name, code);
  res
    .status(StatusCodes.OK)
    .json({ msg: "Your verification email has been sent." });
};

const checkPasswordCode = async (req, res) => {
  const { code } = req.body;
  const { userId } = req.user;
  if (!code) {
    throw new BadRequestError("Please provide required data.");
  }
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!(code === user.passwordNumber)) {
    throw new BadRequestError("Code is invalid.");
  }
  if (new Date() > user.passwordExpirationDate) {
    throw new BadRequestError(
      "Expiration date has been reached, please get contact with our customer service."
    );
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { passwordNumber: "", passwordExpirationDate: null },
    { new: true, runValidators: true }
  );
  res.status(StatusCodes.OK).json({ success: true });
};

const resetPassword = async (req, res) => {
  const { newPassword, newBackupPassword, success } = req.body;
  const { userId } = req.user;
  if (!newPassword || !newBackupPassword) {
    throw new BadRequestError("Please provide required data.");
  }
  if (!(newPassword === newBackupPassword)) {
    throw new BadRequestError("Both passwords have to match with each other.");
  }
  if (!success) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  const user = await User.findOne({ _id: userId });
  if (user.comparePassword(newPassword)) {
    throw new BadRequestError("New password cannot be same as old password.");
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { password: newPassword },
    { new: true, runValidators: true, timestamps: true }
  );

  res
    .status(StatusCodes.OK)
    .json({ msg: "Your password has been updated successfully." });
};

const showPassword = async (req, res) => {
  const { role } = req.user;
  if (role === "user" || role === "owner") {
    const { userId } = req.user;
    const { password } = req.body;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError("User couldn't found.");
    }
    if (!user.comparePassword(password)) {
      throw new UnauthorizedError("Passwords are not match");
    }
    const userPassword = await User.findOne({ _id: userId }).select("password");
    res.status(StatusCodes.OK).json({ password: userPassword });
  }

  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide user credentials.");
    }
    const userPassword = await User.findOne({ _id: id }).select("password");
    if (!userPassword) {
      throw new NotFoundError("User couldn't found.");
    }
    res.status(StatusCodes.OK).json({ password: userPassword });
  }
};

const replyFriendRequest = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { accepted } = req.body;
  if (!id || !accepted) {
    throw new BadRequestError("Please provide required data.");
  }

  const sendUser = await User.findOne({ _id: id });
  const currentUser = await User.findOne({ _id: id });
  if (!sendUser) {
    throw new NotFoundError("User couldn't found.");
  }

  if (!sendUser.selfFriendRequests.includes(userId)) {
    throw new BadRequestError(
      "This user has not sent a friend request for you."
    );
  }

  if (!currentUser) {
    throw new NotFoundError("User couldn't found.");
  }

  if (currentUser.friendRequests.includes(id)) {
    throw new BadRequestError("You have no friend request from that person.");
  }
  if (accepted) {
    await User.findOneAndUpdate(
      { _id: id },
      {
        $pull: { selfFriendRequests: new mongoose.Types.ObjectId(userId) },
        $addToSet: { friends: new mongoose.Types.ObjectId(userId) },
      },
      { new: true, runValidators: true, timestamps: false }
    );
    const currentUserFriends = await User.findOneAndUpdate(
      { _id: userId },
      {
        $pull: { friendRequests: new mongoose.Types.ObjectId(id) },
        $addToSet: { friends: new mongoose.Types.ObjectId(id) },
      },
      { new: true, runValidators: true, timestamps: false }
    ).select("friends");
    res.status(StatusCodes.OK).json({ friends: currentUserFriends });
  }

  if (!accepted) {
    await User.findOneAndUpdate(
      { _id: id },
      { $pull: { selfFriendRequests: new mongoose.Types.ObjectId(userId) } },
      { new: true, runValidators: true, timestamps: false }
    );
    const currentUserFriends = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { friendRequests: new mongoose.Types.ObjectId(id) } },
      { new: true, runValidators: true, timestamps: false }
    ).select("friends");
    res.status(StatusCodes.OK).json({ friends: currentUserFriends });
  }
};

const updateDeleteSingleUser = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }
};

const updateDeleteManyUser = async (req, res) => {
  res.send("updateDeleteManyUser");
};

const deleteSingleUser = async (req, res) => {
  res.send("deleteSingleUser");
};

const deleteManyUser = async (req, res) => {
  res.send("deleteManyUser");
};

module.exports = {
  getManyUser,
  getSingleUser,
  showUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteSingleUser,
  updateDeleteManyUser,
  deleteSingleUser,
  deleteManyUser,
  getByGoogleId,
  sendFriendRequest,
  replyFriendRequest,
  requestPasswordChange,
  checkPasswordCode,
  resetPassword,
  showPassword,
};
