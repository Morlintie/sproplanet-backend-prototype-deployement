const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const Invitation = require("../models/Invitation");
const Advert = require("../models/Advert");
const {
  notificationNamespace,
  onlineUsers,
} = require("../server/serverConfig");

const createInvite = async (req, res) => {
  const { advert, recipient, role, message } = req.body;
  const { userId, role: userRole } = req.user;
  if (!advert || !recipient || !role) {
    throw new BadRequestError("Please provide all required data");
  }

  const existingAdvert = await Advert.findOne({
    _id: advert,
    isDeleted: false,
    archived: false,
    status: { $in: ["open"] },
  });
  if (!existingAdvert) {
    throw new BadRequestError(
      "Advert not found or is not open for invitations"
    );
  }
  if (
    existingAdvert.participants.some(
      (p) => p.user.toString() === recipient.toString()
    )
  ) {
    throw new BadRequestError(
      "Recipient is already a participant of this advert"
    );
  }
  if (
    existingAdvert.waitingList.some(
      (p) => p.user.toString() === recipient.toString()
    )
  ) {
    throw new BadRequestError(
      "Recipient is already on the waiting list of this advert"
    );
  }
  if (userRole === "user") {
    const sender = userId;
    if (!sender) {
      throw new BadRequestError("Please provide all required data");
    }

    if (
      !existingAdvert.adminAdvert.some(
        (p) => p.toString() === userId.toString()
      )
    ) {
      throw new BadRequestError("You are not an admin of this advert");
    }

    const createObject = {
      advert,
      sender,
      recipient,
      role,
      message,
    };
    Object.keys(createObject).forEach((key) => {
      if (createObject[key] === undefined || createObject[key] === null) {
        delete createObject[key];
      }
    });
    const invite = await Invitation.create(createObject);
    if (onlineUsers[recipient]) {
      notificationNamespace.to(onlineUsers[recipient]).emit("new-invite", {
        invite,
      });
    }
    res.status(StatusCodes.CREATED).json({
      message: "Invitation created successfully",
    });
  }
  if (userRole === "admin") {
    const { sender } = req.body;
    if (!sender) {
      throw new BadRequestError("Please provide all required data");
    }
    if (
      !existingAdvert.adminAdvert.some(
        (p) => p.toString() === sender.toString()
      )
    ) {
      throw new BadRequestError("Sender is not an admin of this advert");
    }
    const createObject = {
      advert,
      sender,
      recipient,
      role,
      message,
    };
    Object.keys(createObject).forEach((key) => {
      if (createObject[key] === undefined || createObject[key] === null) {
        delete createObject[key];
      }
    });
    const invite = await Invitation.create(createObject);
    if (onlineUsers[recipient]) {
      notificationNamespace.to(onlineUsers[recipient]).emit("new-invite", {
        invite,
      });
    }
    res.status(StatusCodes.CREATED).json({
      message: "Invitation created successfully",
    });
  }
};

const getUserInvites = async (req, res) => {
  const { role, userId } = req.user;
  const { status } = req.query;
  const queryObject = {};
  if (status) {
    const possibleStatuses = [
      "pending",
      "accepted",
      "declined",
      "expired",
      "cancelled",
    ];
    if (!possibleStatuses.includes(status)) {
      throw new BadRequestError("Invalid status provided");
    }
    queryObject.status = status;
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const skip = (page - 1) * limit;
    const invites = await Invitation.find({
      recipient: userId,
      isDeleted: false,
      archived: false,
      ...queryObject,
    })
      .select(userSelectedFields)
      .limit(limit)
      .skip(skip)
      .sort("-createdAt")
      .lean();
    if (!invites || invites.length === 0) {
      throw new NotFoundError("No invites found");
    }
    const total = await Invitation.countDocuments({
      recipient: userId,
      ...queryObject,
    });
    res.status(StatusCodes.OK).json({
      invites,
      total,
      limit,
      count: invites.length,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    if (!id) {
      throw new BadRequestError("Please provide user id");
    }
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const invites = await Invitation.find({ recipient: id, ...queryObject })
      .select(select)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();
    if (!invites || invites.length === 0) {
      throw new NotFoundError("No invites found for this user");
    }
    const total = await Invitation.countDocuments({
      recipients: id,
      ...queryObject,
    });

    res.status(StatusCodes.OK).json({
      invites,
      total,
      limit,
      count: invites.length,
    });
  }
};

const getSendUserInvites = async (req, res) => {
  const { role, userId } = req.user;
  const { status } = req.query;
  const queryObject = {};
  if (status) {
    const possibleStatuses = [
      "pending",
      "accepted",
      "declined",
      "expired",
      "cancelled",
    ];
    if (!possibleStatuses.includes(status)) {
      throw new BadRequestError("Invalid status provided");
    }
    queryObject.status = status;
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const invites = await Invitation.find({
      sender: userId,
      isDeleted: false,
      archived: false,
      ...queryObject,
    })
      .select(userSelectedFields)
      .limit(limit)
      .skip(skip)
      .sort("-createdAt")
      .lean();
    if (!invites || invites.length === 0) {
      throw new NotFoundError("No invites found");
    }
    const total = await Invitation.countDocuments({
      sender: userId,
      ...queryObject,
    });
    res.status(StatusCodes.OK).json({
      invites,
      total,
      limit,
      count: invites.length,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }
    if (!id) {
      throw new BadRequestError("Please provide user id");
    }
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const page = req.query.page ? Number(req.query.page) : 1;
    const skip = (page - 1) * limit;
    const invites = await Invitation.find({ sender: id, ...queryObject })
      .select(select)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean();
    if (!invites || invites.length === 0) {
      throw new NotFoundError("No invites found for this user");
    }
    const total = await Invitation.countDocuments({
      sender: id,
      ...queryObject,
    });
    res.status(StatusCodes.OK).json({
      invites,
      total,
      limit,
      count: invites.length,
    });
  }
};

const getSingleInvite = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide invitation id");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        $or: [{ recipient: userId }, { sender: userId }],
        isDeleted: false,
        archived: false,
      },
      {
        seen: true,
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(userSelectedFields)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }

    res.status(StatusCodes.OK).json({
      invite,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (!select) {
      select = "-__v";
    } else {
      select = select.split(",").join(" ");
    }
    const invite = await Invitation.findOne({
      _id: id,
    })
      .select(select)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
};

const revokeInvite = async (req, res) => {
  // user part is finished, complete the admin part
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        sender: userId,
        status: "pending",
        isDeleted: false,
        archived: false,
      },
      {
        status: "cancelled",
        respondedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(userSelectedFields)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found or cannot be revoked");
    }
    if (onlineUsers[invite.recipient]) {
      notificationNamespace
        .to(onlineUsers[invite.recipient])
        .emit("invite-revoked", {
          invite,
        });
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }

    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        status: "cancelled",
        respondedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(select)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (onlineUsers[invite.recipient]) {
      notificationNamespace
        .to(onlineUsers[invite.recipient])
        .emit("invite-revoked", {
          invite,
        });
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
};

const acceptInvite = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const invite = await Invitation.findOne({
      _id: id,
      recipient: userId,
      status: "pending",
      isDeleted: false,
      archived: false,
    }).lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }

    const advert = await Advert.findOne({
      _id: invite.advert,
      isDeleted: false,
      archived: false,
    }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (
      advert.participants.some((p) => {
        return p.user.toString() === userId.toString();
      })
    ) {
      throw new BadRequestError("You are already a participant of this advert");
    }
    if (
      advert.waitingList.some((p) => {
        return p.user.toString() === userId.toString();
      })
    ) {
      throw new BadRequestError(
        "You are already on the waiting list of this advert"
      );
    }
    if (advert.status !== "open") {
      throw new BadRequestError("Advert is not open for invitations");
    }

    const newAdvert = await Advert.updateOne(
      {
        _id: invite.advert,
        isDeleted: false,
        archived: false,
      },
      {
        $addToSet: {
          participants: {
            user: userId,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    );
    const newInvite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
        status: "pending",
        isDeleted: false,
        archived: false,
      },
      {
        status: "accepted",
        respondedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(userSelectedFields)
      .lean();
    if (onlineUsers[invite.sender]) {
      notificationNamespace
        .to(onlineUsers[invite.sender])
        .emit("invite-accepted", {
          invite: newInvite,
        });
    }

    if (
      advert.participants.some((p) => {
        return (
          onlineUsers[p.user.toString()] !== undefined ||
          onlineUsers[p.user.toString()] !== null
        );
      })
    ) {
      notificationNamespace.to(advert._id).emit("new-participant", {
        advert: newAdvert,
      });
    }

    res.status(StatusCodes.OK).json({
      newInvite,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const invite = await Invitation.findOne({
      _id: id,
      status: "pending",
    }).lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    const advert = await Advert.findOne({
      _id: invite.advert,
      isDeleted: false,
      archived: false,
    }).lean();
    if (!advert) {
      throw new NotFoundError("Advert not found");
    }
    if (
      advert.participants.some((p) => {
        return p.user.toString() === invite.recipient.toString();
      })
    ) {
      throw new BadRequestError(
        "Recipient is already a participant of this advert"
      );
    }
    if (
      advert.waitingList.some((p) => {
        return p.user.toString() === invite.recipient.toString();
      })
    ) {
      throw new BadRequestError(
        "Recipient is already ont he waiting list of this advert"
      );
    }
    if (advert.status !== "open") {
      throw new BadRequestError("Advert is not open for invitations");
    }
    const newAdvert = await Advert.updateOne(
      {
        _id: invite.advert,
        isDeleted: false,
        archived: false,
      },
      {
        $addToSet: {
          participants: {
            user: invite.recipient,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    );
    const newInvite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        status: "accepted",
        respondedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(select)
      .lean();
    if (onlineUsers[invite.sender]) {
      notificationNamespace
        .to(onlineUsers[invite.sender])
        .emit("invite-accepted", {
          invite: newInvite,
        });
    }
    if (
      advert.participants.some((p) => {
        return (
          onlineUsers[p.user.toString()] !== undefined ||
          onlineUsers[p.user.toString()] !== null
        );
      })
    ) {
      notificationNamespace.to(advert._id).emit("new-participant", {
        advert: newAdvert,
      });
    }
    res.status(StatusCodes.OK).json({
      invite: newInvite,
    });
  }
};

const rejectInvite = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data ");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
        status: "pending",
        isDeleted: false,
        archived: false,
      },
      { status: "declined", respondedAt: new Date() },
      { new: true, runValidators: true, timestamps: true }
    )
      .select(userSelectedFields)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (onlineUsers[invite.sender]) {
      notificationNamespace
        .to(onlineUsers[invite.sender])
        .emit("invite-rejected", {
          invite,
        });
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const invite = await Invitation.findOneAndUpdate(
      { _id: id, status: "pending" },
      { status: "declined", respondedAt: new Date() },
      { new: true, runValidators: true, timestamps: true }
    )
      .select(select)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (onlineUsers[invite.sender]) {
      notificationNamespace
        .to(onlineUsers[invite.sender])
        .emit("invite-rejected", { invite });
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
};

const softDeleteInvite = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived";
    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        $or: [{ recipient: userId }, { sender: userId }],

        isDeleted: false,
        archived: false,
      },
      {
        isDeleted: true,
        archived: true,
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(userSelectedFields)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (invite.sender === userId) {
      if (onlineUsers[invite.recipient]) {
        notificationNamespace
          .to(onlineUsers[invite.recipient])
          .emit("invite-deleted", {
            inviteId: invite._id,
          });
      }
    }
    if (invite.recipient === userId) {
      if (onlineUsers[invite.sender]) {
        notificationNamespace
          .to(onlineUsers[invite.sender])
          .emit("invite-deleted", {
            inviteId: invite._id,
          });
      }
    }
    res.status(StatusCodes.NO_CONTENT).json({
      message: "Invitation deleted successfully",
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const invite = await Invitation.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
        archived: false,
      },
      {
        isDeleted: true,
        archived: true,
      },
      {
        new: true,
        runValidators: true,
        timestamps: true,
      }
    )
      .select(select)
      .lean();
    if (!invite) {
      throw new NotFoundError("Invitation not found");
    }
    if (onlineUsers[invite.recipient]) {
      notificationNamespace
        .to(onlineUsers[invite.recipient])
        .emit("invite-deleted", {
          inviteId: invite - _id,
        });
    }
    if (onlineUsers[invite.sender]) {
      notificationNamespace
        .to(onlineUsers[invite.sender])
        .emit("invite-deleted", {
          inviteId: invite._id,
        });
    }
    res.status(StatusCodes.OK).json({
      invite,
    });
  }
};

const deleteInvite = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  const invite = await Invitation.findOne({ _id: id });
  if (!invite) {
    throw new NotFoundError("Invitation not found");
  }
  await Invitation.deleteOne({ _id: id });
  res.status(StatusCodes.NO_CONTENT).json({
    message: "Invitation deleted successfully",
  });
};

module.exports = {
  createInvite,
  getUserInvites,
  getSendUserInvites,
  getSingleInvite,
  revokeInvite,
  acceptInvite,
  rejectInvite,
  deleteInvite,
  softDeleteInvite,
};
