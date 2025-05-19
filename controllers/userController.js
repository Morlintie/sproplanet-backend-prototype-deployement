const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { adminUserQuery } = require("../utils");
const { ForbiddenError, NotFoundError, BadRequestError } = require("../errors");

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
  const user = await User.findOne({ _id: userId, isDeleted: false });
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
  res.send("sendFriendRequest");
};

const updateManyUser = async (req, res) => {
  res.send("updateManyUser");
};

const updateSingleUser = async (req, res) => {
  res.send("updateSingleUser");
};

const updatePasswordUser = async (req, res) => {
  res.send("updatePasswordUser");
};

const replyFriendRequest = async (req, res) => {
  res.send("replyFriendRequest");
};

const updateDeleteSingleUser = async (req, res) => {
  res.send("updateDeleteSingleUser");
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
};
