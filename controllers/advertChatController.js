const { BadRequestError, NotFoundError } = require("../errors");
const AdvertChatMessage = require("../models/AdvertChat");
const Advert = require("../models/Advert");
const { chatNamespace, chatOnlineUsers } = require("../server/serverConfig");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;

const sendMessage = async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { content, attachments } = req.body;
  if (!content && !attachments) {
    throw new BadRequestError("Please provide content or attachments.");
  }
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  if (content && attachments) {
    throw new BadRequestError(
      "You can not send both content and attachments at the same time."
    );
  }
  if (content && content === "") {
    throw new BadRequestError("Please provide content.");
  }

  const advert = await Advert.findOne({ _id: id }).select("participants");
  if (!advert) {
    throw new NotFoundError("Advert not found.");
  }

  if (!advert.participants.some((p) => p.user.toString() === userId)) {
    throw new BadRequestError("You are not a participant of this advert.");
  }

  if (attachments) {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      throw new BadRequestError(
        "Attachments must be an array and cannot be empty"
      );
    }

    // [{content, caption, mimetype}]
    for (let i = 0; i < attachments.length; i++) {
      if (attachments[i].mimetype === "video/") {
        if (!attachments[i].content.startsWith("data:video/")) {
          throw new BadRequestError("Attachment must be a video.");
        }
        const base64String = attachments[i].content.split(",")[1];
        const dataInBytes = Buffer.from(base64String, "base64");
        if (dataInBytes.length > 15 * 1024 * 1024) {
          throw new BadRequestError("Video size must be less than 15MB");
        }
        const uploadResult = await cloudinary.uploader.upload_large(
          dataInBytes,
          {
            resource_type: "video",
            folder: "tikitaka/advertChat",
          }
        );
        attachments[i] = {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          mimeType: attachments[i].mimeType,
          caption: attachments[i].caption || "",
        };
      }
      if (attachments[i].mimetype.startsWith("image/")) {
        if (!attachments[i].content.startsWith("data:image/")) {
          throw new BadRequestError("Attachment must be an image.");
        }
        const base64String = attachments[i].content.split(",")[1];
        const dataInBytes = Buffer.from(base64String, "base64");
        if (dataInBytes.length > 5 * 1024 * 1024) {
          throw new BadRequestError("Image size must be less than 5MB");
        }
        const uploadResult = await cloudinary.uploader.upload(dataInBytes, {
          resource_type: "image",
          folder: "tikitaka/advertChat",
        });
        attachments[i] = {
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          mimeType: attachments[i].mimeType,
          caption: attachments[i].caption || "",
        };
      }
    }
  }

  let notSeenBy = [];
  const advertRoomSockets = await chatNamespace
    .in(advert._id.toString())
    .fetchSockets();

  for (let i = 0; i < advert.participants.length; i++) {
    if (!advertRoomSockets) {
      notSeenBy = advert.participants.map((p) => p.user);
      break;
    }

    if (
      !advertRoomSockets.includes(
        chatOnlineUsers[advert.participants[i].user.toString()]
      )
    ) {
      notSeenBy = [...notSeenBy, advert.participants[i].user];
    }
  }
  notSeenBy = notSeenBy.filter((user) => user.toString() !== userId);
  const createObject = {
    advert: id,
    sender: userId,
    type:
      attachments?.length > 1
        ? "system"
        : attachments?.length === 1
        ? attachments[0]?.mimeType.startsWith("image/")
          ? "image"
          : attachments[0]?.mimeType.startsWith("video/")
          ? "video"
          : "system"
        : "text",
    content,
    attachments,
    notSeenBy,
  };
  Object.keys(createObject).forEach((key) => {
    if (createObject[key] === undefined || createObject[key] === null) {
      delete createObject[key];
    }
  });
  const message = await AdvertChatMessage.create(createObject);
  if (
    (await chatNamespace.in(id).fetchSockets()) &&
    (await chatNamespace.in(id).fetchSockets().length) > 0
  ) {
    chatNamespace.to(id).emit("newMessage", message);
  }
  res.status(StatusCodes.CREATED).json({
    message: "Message sent successfully",
  });
};

const getMessages = async (req, res) => {
  const { id } = req.params;
  const { role, userId } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }

  const advert = await Advert.findOne({ _id: id })
    .select("participants")
    .lean();
  if (!advert) {
    throw new NotFoundError("Advert not found.");
  }

  if (role === "user") {
    if (!advert.participants.some((p) => p.user.toString() === userId)) {
      throw new BadRequestError("You are not a participant of this advert.");
    }
    const userSelectedFields = "-__v -isDeleted -archived ";
    const messages = await AdvertChatMessage.find({
      advert: id,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort({ createdAt: 1 })
      .lean()
      .populate({
        path: "sender",
        select:
          "name profilePicture email _id school age goalKeeper phoneNumber description",
      });
    if (!messages) {
      throw new NotFoundError("Messages not found.");
    }
    res.status(StatusCodes.OK).json({
      messages,
    });
  }
  if (role === "admin") {
    let { select, sort } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v ";
    }

    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt";
    }

    const messages = await AdvertChatMessage.find({ advert: id })
      .select(select)
      .sort(sort)
      .lean();
    if (!messages) {
      throw new NotFoundError("Messages not found.");
    }

    res.status(StatusCodes.OK).json({
      messages,
    });
  }
};

const getUnseenMessages = async (req, res) => {
  const { userId, role } = req.user;

  if (role === "user") {
    const participantAdverts = await Advert.find({
      "participants.user": userId,
      isDeleted: false,
      archived: false,
    })
      .select("_id")
      .lean();
    if (!participantAdverts || participantAdverts.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        adverts: [],
      });
    }
    const unseenMessages = await AdvertChatMessage.find({
      advert: { $in: participantAdverts.map((advert) => advert._id) },
      notSeenBy: userId,
      isDeleted: false,
      archived: false,
    })
      .select("advert")
      .lean();
    if (!unseenMessages || unseenMessages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        adverts: participantAdverts,
      });
    }
    const messages = unseenMessages.reduce((acc, message) => {
      if (!acc[message.advert]) {
        acc[message.advert] = unseenMessages.filter((m) => {
          return m.advert.toString() === message.advert.toString();
        }).length;
      }
      return acc;
    }, {});
    res.status(StatusCodes.OK).json({
      messages,
      adverts: participantAdverts,
    });
  }
  if (role === "admin") {
    const { participantId } = req.body;
    if (!participantId) {
      throw new BadRequestError("Please provide required data");
    }
    const participantAdverts = await Advert.find({
      "participants.user": participantId,
      isDeleted: false,
      archived: false,
    })
      .select("_id ")
      .lean();
    if (!participantAdverts || participantAdverts.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        adverts: [],
      });
    }
    const unseenMessages = await AdvertChatMessage.find({
      advert: { $in: participantAdverts.map((advert) => advert._id) },
      notSeenBy: participantId,
      isDeleted: false,
      archived: false,
    });
    if (!unseenMessages || unseenMessages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        adverts: participantAdverts,
      });
    }
    const messages = unseenMessages.reduce((acc, message) => {
      if (!acc[message.advert]) {
        acc[message.advert] = unseenMessages.filter((m) => {
          return m.advert.toString() === message.advert.toString();
        }).length;
      }
      return acc;
    }, {});
    res.status(StatusCodes.OK).json({
      messages,
      adverts: participantAdverts,
    });
  }
};

const getSingleMessage = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const userSelectedFields = "-__v -isDeleted -archived ";
    const message = await AdvertChatMessage.findOne({
      _id: id,
      sender: userId,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "sender",
        select:
          "name profilePicture email _id school age goalKeeper phoneNumber description",
      })
      .populate({
        path: "advert",
        select: "-__v -isDeleted -archived ",
        populate: {
          path: "booking",
          select: "start status totalPlayers price notes ",
        },
        populate: {
          path: "participants.user",
          select:
            "name email school age profilePicture goalKeeper phoneNumber description",
        },
        populate: {
          path: "waitingList.user",
          select:
            "name email school age profilePicture goalKeeper phoneNumber description",
        },
        populate: {
          path: "pitch",
          select:
            "name description specifications facilities pricing media contact rating status refundAllowed",
        },
      })
      .populate({
        path: "notSeenBy",
        select:
          "name profilePicture email _id school age goalKeeper phoneNumber description",
      });
    if (!message) {
      throw new NotFoundError("Message not found or you are not the sender");
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const message = await AdvertChatMessage.findOne({
      _id: id,
      isDeleted: false,
      archived: false,
    })
      .select(select)
      .lean();
    if (!message) {
      throw new NotFoundError("Message not found");
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
};

const softDeleteMessage = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }

  if (role === "user") {
    const message = await AdvertChatMessage.findOne({
      _id: id,
      sender: userId,
      isDeleted: false,
      archived: false,
    })
      .lean()
      .select("_id advert");
    if (!message) {
      throw new NotFoundError("Message not found or you are not the sender.");
    }

    await AdvertChatMessage.updateOne(
      { _id: id, sender: userId, isDeleted: false, archived: false },
      { isDeleted: true, archived: true }
    );
    if (
      (await chatNamespace.in(message.advert.toString()).fetchSockets()) &&
      (await chatNamespace.in(message.advert.toString()).fetchSockets()
        .length) > 0
    ) {
      chatNamespace.to(message.advert.toString()).emit("messageDeleted", {
        messageId: id,
      });
    }
    res.status(StatusCodes.NO_CONTENT).json({
      message: "Message deleted successfully",
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const message = await AdvertChatMessage.findOne({
      _id: id,
      isDeleted: false,
      archived: false,
    })
      .lean()
      .select("_id advert");
    if (!message) {
      throw new NotFoundError("Message not found.");
    }
    const newMessage = await AdvertChatMessage.findOneAndUpdate(
      { _id: id, isDeleted: false, archived: false },
      { isDeleted: true, archived: true },
      { runValidators: true, new: true, timestamps: true }
    )
      .select(select)
      .lean();
    if (
      (await chatNamespace.in(message.advert.toString()).fetchSockets()) &&
      (await chatNamespace.in(message.advert.toString()).fetchSockets()
        .length) > 0
    ) {
      chatNamespace.to(message.advert.toString()).emit("messageDeleted", {
        messageId: id,
      });
    }

    res.status(StatusCodes.OK).json({
      message: newMessage,
    });
  }
};

const markMessageSeen = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user") {
    const advert = await Advert.findOne({
      _id: id,
      "participants.user": userId,
    })
      .select("participants")
      .lean();
    if (!advert) {
      throw new NotFoundError("Advert not found.");
    }
    if (!advert.participants.some((p) => p.user.toString() === userId)) {
      throw new BadRequestError("You are not a participant of this advert");
    }

    await AdvertChatMessage.updateMany(
      {
        advert: id,
        notSeenBy: userId,
        isDeleted: false,
        archived: false,
      },
      {
        $pull: { notSeenBy: userId },
      }
    );
    if (
      (await chatNamespace.in(id).fetchSockets()) &&
      (await chatNamespace.in(id).fetchSockets().length) > 0
    ) {
      chatNamespace.to(id).emit("messageSeen", {
        userId: userId,
        advertId: id,
      });
    }
    res.status(StatusCodes.OK).json({
      message: "Messages marked as seen successfully",
    });
  }
  if (role === "admin") {
    const { participantId } = req.body;
    if (!participantId) {
      throw new BadRequestError("Please provide required data");
    }
    const advert = await Advert.findOne({
      _id: id,
      "participants.user": participantId,
      isDeleted: false,
      archived: false,
    })
      .select("participants")
      .lean();
    if (!advert) {
      throw new NotFoundError("Advert not found.");
    }
    if (!advert.participants.some((p) => p.user.toString() === participantId)) {
      throw new BadRequestError("You are not a participant of this advert");
    }
    await AdvertChatMessage.updateMany(
      {
        advert: id,
        notSeenBy: participantId,
        isDeleted: false,
        archived: false,
      },
      {
        $pull: { notSeenBy: participantId },
      }
    );
    if (
      (await chatNamespace.in(id).fetchSockets()) &&
      (await chatNamespace.in(id).fetchSockets().length) > 0
    ) {
      chatNamespace.to(id).emit("messageSeen", {
        userId: participantId,
        advertId: id,
      });
    }
    res.status(StatusCodes.OK).json({
      message: "Messages marked as seen successfully",
    });
  }
};

const deleteMessage = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  const message = await AdvertChatMessage.findOne({
    _id: id,
  })
    .select("advert")
    .lean();
  if (!message) {
    throw new BadRequestError("Message not found");
  }
  await AdvertChatMessage.deleteOne({ _id: id });
  if (
    (await chatNamespace.in(message.advert.toString()).fetchSockets()) &&
    (await chatNamespace.in(message.advert.toString()).fetchSockets().length) >
      0
  ) {
    chatNamespace.to(message.advert.toString()).emit("messageDeleted", {
      messageId: id,
    });
  }
  res.status(StatusCodes.NO_CONTENT).json({
    message: "Message deleted successfully",
  });
};

module.exports = {
  sendMessage,
  getMessages,
  getUnseenMessages,
  getSingleMessage,
  softDeleteMessage,
  markMessageSeen,
  deleteMessage,
};
