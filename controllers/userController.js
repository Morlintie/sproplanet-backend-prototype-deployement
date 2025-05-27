const mongoose = require("mongoose");
const { StatusCodes, METHOD_NOT_ALLOWED } = require("http-status-codes");
const User = require("../models/User");
const Token = require("../models/Token");
const crypto = require("crypto");
const {
  adminUserQuery,
  adminUserUpdateQuery,
  adminUserQueryObject,
  resetPasswordEmail,
  deletionEmail,
  createCookie,
} = require("../utils");
const {
  ForbiddenError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../errors");

const getManyUser = async (req, res) => {
  const role = req?.user?.role;
  const userId = req.user?.userId;

  if (role === "banned") {
    throw new ForbiddenError(
      "You have been banned, please get contact with our customer service."
    );
  }

  const userSearch = req.body.search;

  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id ";
  const users = await User.find({
    name: { $regex: userSearch, $options: "i" },
    isDeleted: false,
    _id: { $ne: userId },
  })
    .select(userSelectedFields)
    .sort("name");

  res.status(StatusCodes.OK).json({ users });
};

const getAdmin = async (req, res) => {
  const users = await adminUserQuery(req);

  res.status(StatusCodes.OK).json({ users: users });
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

  let userId;
  if (req.user) {
    userId = req.user.userId;
  }
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id selfFriendRequests friendRequests recentlySearchedUser phoneNumber description";
  const user = await User.findOne({ _id: id, isDeleted: false }).select(
    userSelectedFields
  );
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }

  if (userId) {
    const currentUser = await User.findOne({ _id: userId });

    if (
      !currentUser.recentlySearchedUser.includes(id) &&
      currentUser.recentlySearchedUser.length < 10
    ) {
      await User.findOneAndUpdate(
        { _id: userId },
        { $push: { recentlySearchedUser: id } }
      );
    }
    if (
      !currentUser.recentlySearchedUser.includes(id) &&
      currentUser.recentlySearchedUser.length >= 10
    ) {
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $pull: {
            recentlySearchedUser:
              currentUser.recentlySearchedUser[
                currentUser.recentlySearchedUser.length - 1
              ],
          },
        }
      );
      await User.findOneAndUpdate(
        { _id: userId },
        {
          $push: {
            recentlySearchedUser: id,
          },
        }
      );
    }
  }
  res.status(StatusCodes.OK).json({ user });
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

  const userSearch = req.body.search;
  const userPage = req.body.page;

  const userLimit = 30;
  const userSkip = (userPage - 1) * userLimit;
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id";
  const users = await User.find({
    name: { $regex: userSearch },
    isDeleted: false,
    goalKeeper: true,
  })
    .select(userSelectedFields)
    .sort("name")
    .limit(userLimit)
    .skip(userSkip);

  res.status(StatusCodes.OK).json({ users });
};

const getByGoogleId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }

  const user = await User.findOne({ googleId: id }).select("-password");

  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }

  res.status(StatusCodes.OK).json({ user });
};

const sendFriendRequest = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide user credentials.");
  }

  const sendUser = await User.findOne({ _id: id, isDeleted: false }).select(
    "-password"
  );
  const currentUser = await User.findOne({ _id: userId });

  if (!currentUser) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!sendUser) {
    throw new NotFoundError("User couldn't found.");
  }

  if (sendUser.role === "banned") {
    throw new BadRequestError("This user has been banned.");
  }

  if (id === userId) {
    throw new BadRequestError(
      "Users cannot send friend requests for themselves."
    );
  }

  if (sendUser.friendRequests.includes(userId)) {
    throw new BadRequestError(
      "You have already sent friend request for that person."
    );
  }

  if (sendUser.selfFriendRequests.includes(userId)) {
    throw new BadRequestError(
      "This person has already sent a friend request for you."
    );
  }

  if (sendUser.friends.includes(userId)) {
    throw new BadRequestError("You are already friends with that person.");
  }

  if (currentUser.friendRequests.includes(id)) {
    throw new BadRequestError(
      "This person has already sent a friend request for you."
    );
  }

  if (currentUser.selfFriendRequests.includes(id)) {
    throw new BadRequestError(
      "You have already sent friend request for that person."
    );
  }

  if (currentUser.friends.includes(id)) {
    throw new BadRequestError("You are already friends with that person.");
  }

  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id selfFriendRequests friendRequests recentlySearchedUser phoneNumber description";

  await User.findOneAndUpdate(
    { _id: id },
    { $addToSet: { friendRequests: new mongoose.Types.ObjectId(userId) } },
    { new: true, runValidators: true, timestamps: false }
  );
  const friendRequest = await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { selfFriendRequests: new mongoose.Types.ObjectId(id) } },
    { new: true, runValidators: true, timestamps: false }
  ).select(userSelectedFields);

  res.status(StatusCodes.CREATED).json({ user: friendRequest });
};

const updateManyUser = async (req, res) => {
  const newUsers = await adminUserUpdateQuery(req);
  res.status(StatusCodes.OK).json({ users: newUsers });
};

const updateSingleUser = async (req, res) => {
  const { userId } = req.user;
  const { name, email, school, age, profilePicture, location } = req.body;
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id selfFriendRequests friendRequests recentlySearchedUser phoneNumber description";
  const newUser = await User.findOneAndUpdate(
    { _id: userId },
    { name, email, school, age, profilePicture, location },
    { new: true, runValidators: true, timestamps: true }
  ).select(userSelectedFields);
  if (!newUser) {
    throw new NotFoundError("User couldn't found.");
  }
  let refreshToken = await Token.findOne({ user: userId });
  if (!refreshToken) {
    const token = crypto.randomBytes(16).toString("hex");
    refreshToken = await Token.create({ token, user: userId });
  }
  const cookieUser = {
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    userId: newUser._id,
  };
  createCookie(res, cookieUser, refreshToken);
  res.status(StatusCodes.OK).json({ user: newUser });
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
  res.status(StatusCodes.OK).json({ user });
};

const requestPasswordChange = async (req, res) => {
  const { userId } = req.user;
  const { password } = req.body;
  if (!password) {
    throw new BadRequestError("Please provide requested data.");
  }
  const oldUser = await User.findOne({ _id: userId });
  if (!oldUser) {
    throw new NotFoundError("User couldn't found.");
  }
  const isPasswordValid = await oldUser.comparePassword(password);
  if (!isPasswordValid) {
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
    .json({ msg: "Your reset password email has been sent." });
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
  const isPasswordValid = await user.comparePassword(newPassword);
  if (isPasswordValid) {
    throw new BadRequestError("New password cannot be same as old password.");
  }

  const newUser = await User.findOneAndUpdate(
    { _id: userId },
    { password: newPassword },
    { new: true, runValidators: true, timestamps: true }
  );

  let refreshToken = await Token.findOne({ user: userId });
  if (!refreshToken) {
    const token = crypto.randomBytes(16).toString("hex");
    refreshToken = await Token.create({ token, user: userId });
  }
  const cookieUser = {
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    userId: newUser._id,
  };
  createCookie(res, cookieUser, refreshToken);

  res
    .status(StatusCodes.OK)
    .json({ msg: "Your password has been updated successfully." });
};

const replyFriendRequest = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { accepted } = req.body;
  if (!id || !accepted) {
    throw new BadRequestError("Please provide required data.");
  }

  const sendUser = await User.findOne({ _id: id, isDeleted: false });
  const currentUser = await User.findOne({ _id: userId });
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

  if (!currentUser.friendRequests.includes(id)) {
    throw new BadRequestError("You have no friend request from that person.");
  }
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id selfFriendRequests friendRequests recentlySearchedUser phoneNumber description";
  if (accepted === "true") {
    await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
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
    ).select(userSelectedFields);
    res.status(StatusCodes.OK).json({ friends: currentUserFriends });
  }

  if (accepted === "false") {
    await User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $pull: { selfFriendRequests: new mongoose.Types.ObjectId(userId) } },
      { new: true, runValidators: true, timestamps: false }
    );
    const currentUserFriends = await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { friendRequests: new mongoose.Types.ObjectId(id) } },
      { new: true, runValidators: true, timestamps: false }
    ).select(userSelectedFields);
    res.status(StatusCodes.OK).json({ friends: currentUserFriends });
  }
};

const revokeSelfFriendRequest = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const currentUser = await User.findOne({ _id: userId });
  if (!currentUser) {
    throw new NotFoundError("User couldn't found.");
  }
  const sendUser = await User.findOne({ _id: id, isDeleted: false });
  if (!sendUser) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!currentUser.selfFriendRequests.includes(id)) {
    throw new BadRequestError(
      "You have not sent friend request for that person."
    );
  }
  if (!sendUser.friendRequests.includes(userId)) {
    throw new BadRequestError(
      "You have not sent friend request for that person."
    );
  }
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id selfFriendRequests friendRequests recentlySearchedUser phoneNumber description";
  await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $pull: { friendRequests: new mongoose.Types.ObjectId(userId) } },
    { new: true, runValidators: true }
  );
  const newCurrentUser = await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { selfFriendRequests: new mongoose.Types.ObjectId(id) } },
    { new: true, runValidators: true }
  ).select(userSelectedFields);
  res.status(StatusCodes.OK).json({ user: newCurrentUser });
};

const removeFromFriends = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  if (!id) {
    throw BadRequestError("Please provide required data.");
  }
  const currentUser = await User.findOne({ _id: userId });
  if (!currentUser) {
    throw new NotFoundError("User couldn't found.");
  }
  const sendUser = await User.findOne({ _id: id, isDeleted: false });
  if (!sendUser) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!currentUser.friends.includes(id)) {
    throw new BadRequestError("You are not friends with that person.");
  }
  if (!sendUser.friends.includes(userId)) {
    throw new BadRequestError("You are not friends with that person.");
  }
  const userSelectedFields =
    "name email role school age profilePicture friends goalKeeper location createdAt _id recentlySearchedUser selfFriendRequests friendRequests phoneNumber description";
  await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $pull: { friends: new mongoose.Types.ObjectId(userId) } },
    { new: true, runValidators: true }
  );
  const newCurrentUser = await User.findOneAndUpdate(
    { _id: userId },
    { $pull: { friends: new mongoose.Types.ObjectId(id) } },
    { new: true, runValidators: true }
  ).select(userSelectedFields);
  res.status(StatusCodes.OK).json({ user: newCurrentUser });
};

const updateDeleteUserRequest = async (req, res) => {
  const { userId } = req.user;
  const { password } = req.body;
  if (!password) {
    throw new BadRequestError("Please provide required data.");
  }
  const oldUser = await User.findOne({ _id: userId });
  if (!oldUser) {
    throw new NotFoundError("User couldn't found.");
  }
  const isPasswordValid = await oldUser.comparePassword(password);
  if (!isPasswordValid) {
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
    { deleteNumber: code, deleteExpirationDate: fiveMinutes },
    { new: true, runValidators: true }
  );
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }

  await deletionEmail(user.email, user.name, code);
  res
    .status(StatusCodes.OK)
    .json({ msg: "Your deletion email has been sent." });
};

const checkDeletionCode = async (req, res) => {
  const { code } = req.body;
  const { userId } = req.user;
  if (!code) {
    throw new BadRequestError("Please provide required data.");
  }
  const user = await User.findOne({ _id: userId });
  if (!user) {
    throw new NotFoundError("User couldn't found.");
  }
  if (!(code === user.deleteNumber)) {
    throw new BadRequestError("Code is invalid.");
  }
  if (new Date() > user.deleteExpirationDate) {
    throw new BadRequestError(
      "Expiration date has been reached, please get contact with our customer service."
    );
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { deleteNumber: "", deleteExpirationDate: null },
    { new: true, runValidators: true }
  );
  res.status(StatusCodes.OK).json({ success: true });
};

const updateDeleteUser = async (req, res) => {
  const { success } = req.body;
  const { userId } = req.user;
  if (!success) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }

  await User.findOneAndUpdate(
    { _id: userId },
    { isDeleted: true, archived: true },
    { new: true, runValidators: true, timestamps: true }
  );
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

  res.status(StatusCodes.NO_CONTENT);
};

const deleteManyUser = async (req, res) => {
  const queryOperator = adminUserQueryObject(req);
  const users = await User.find(queryOperator);
  const usersId = users.reduce((acc, user) => {
    return (acc = [...acc, user._id]);
  }, []);
  if (!users) {
    throw new NotFoundError("User couldn't found.");
  }
  await User.deleteMany(queryOperator);
  await Token.deleteMany({ user: { $in: usersId } });
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ msg: "Users successfully deleted." });
};

module.exports = {
  getManyUser,
  getSingleUser,
  showUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteUserRequest,
  checkDeletionCode,
  updateDeleteUser,
  deleteManyUser,
  getByGoogleId,
  sendFriendRequest,
  replyFriendRequest,
  requestPasswordChange,
  checkPasswordCode,
  resetPassword,
  revokeSelfFriendRequest,
  removeFromFriends,
  getAdmin,
};
