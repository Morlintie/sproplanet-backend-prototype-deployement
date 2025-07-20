const Chat = require("../models/Chat");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const { NotFoundError, BadRequestError } = require("../errors");
const cloudinary = require("cloudinary").v2;
const { chatOnlineUsers, chatNamespace } = require("../server/serverConfig");
const { encryptMessage, decryptMessage } = require("../utils");

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
  if (id === userId) {
    throw new BadRequestError("You cannot send a message to yourself");
  }
  if (content && attachments) {
    throw new BadRequestError(
      "You can not send both content and attachments at the same time."
    );
  }
  if (content && content === "") {
    throw new BadRequestError("Please provide content.");
  }

  const user = await User.findOne({ _id: userId }).select("_id").lean();

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  if (attachments) {
    if (!Array.isArray(attachments.items) || attachments.items.length === 0) {
      throw new BadRequestError(
        "Attachments must be an array with at least one item"
      );
    }

    const encryptedCaption = attachments.caption
      ? encryptMessage(attachments.caption)
      : null;
    attachments.caption = encryptedCaption;

    // [{content, caption, mimetype}]
    for (let i = 0; i < attachments.length.items; i++) {
      if (attachments.items[i].mimetype === "video/") {
        if (!attachments.items[i].content.startsWith("data:video/")) {
          throw new BadRequestError("Attachment must be a video.");
        }
        const base64String = attachments.items[i].content.split(",")[1];
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

        const secureUrl = encryptMessage(uploadResult.secure_url);

        attachments.items[i] = {
          url: secureUrl,
          public_id: uploadResult.public_id,
          mimeType: attachments.items[i].mimeType,
        };
      }
      if (attachments.items[i].mimetype.startsWith("image/")) {
        if (!attachments.items[i].content.startsWith("data:image/")) {
          throw new BadRequestError("Attachment must be an image.");
        }
        const base64String = attachments.items[i].content.split(",")[1];
        const dataInBytes = Buffer.from(base64String, "base64");
        if (dataInBytes.length > 5 * 1024 * 1024) {
          throw new BadRequestError("Image size must be less than 5MB");
        }
        const uploadResult = await cloudinary.uploader.upload(dataInBytes, {
          resource_type: "image",
          folder: "tikitaka/advertChat",
        });
        const secureUrl = encryptMessage(uploadResult.secure_url);

        attachments.items[i] = {
          url: secureUrl,
          public_id: uploadResult.public_id,
          mimeType: attachments.items[i].mimeType,
        };
      }
    }
  }

  let seenAt = null;

  if (chatOnlineUsers[id]) {
    seenAt = new Date();
  }

  const encryptedContent = content ? encryptMessage(content) : null;
  const createObject = {
    sender: userId,
    recipient: id,
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
    content: encryptedContent,
    attachments,
    seenAt,
  };
  Object.keys(createObject).forEach((key) => {
    if (createObject[key] === undefined || createObject[key] === null) {
      delete createObject[key];
    }
  });
  const message = await Chat.create(createObject);
  if (chatOnlineUsers[id]) {
    chatNamespace.to(chatOnlineUsers[id]).emit("individualNewMessage", {
      message,
    });
  }
  res.status(StatusCodes.CREATED).json({
    message: "Message sent successfully",
  });
};

const getMessages = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }

  const user = await User.findOne({ _id: userId }).select("_id").lean();
  if (!user) {
    throw new NotFoundError("User not found");
  }
  if (role === "user" || role === "owner" || role === "companyOwner") {
    if (id === userId) {
      throw new BadRequestError("You cannot get messages from yourself");
    }
    const userSelectedFields = "-isDeleted -archived -__v";
    const [a, b] = [userId, id].sort();
    const conversationKey = `${a}_${b}`;
    const messages = await Chat.find({
      conversationKey,
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .sort("createdAt")
      .lean()
      .populate({
        path: "sender",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      })
      .populate({
        path: "recipient",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      });

    if (!messages || messages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      messages,
    });
  }
  if (role === "admin") {
    const { chatId } = req.body;
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
    if (!chatId) {
      throw new BadRequestError("Please provide required data");
    }
    const [a, b] = [id, chatId].sort();
    const conversationKey = `${a}_${b}`;
    const messages = await Chat.find({
      conversationKey,
    })
      .select(select)
      .sort(sort)
      .lean();
    if (!messages || messages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: [],
      });
    }
    res.status(StatusCodes.OK).json({
      messages,
    });
  }
};

const getUnseenMessages = async (req, res) => {
  const { userId, role } = req.user;

  if (role === "user" || role === "owner" || role === "companyOwner") {
    const unseenMessages = await Chat.find({
      recipient: userId,
      seenAt: null,
      isDeleted: false,
      archived: false,
    }).lean();

    if (!unseenMessages || unseenMessages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        senders: [],
      });
    }
    let userUnseenMessages = {};
    let userUnseenSenders = [];
    for (let i = 0; i < unseenMessages.length; i++) {
      const sender = await User.findOne({ _id: unseenMessages[i].sender })
        .select("_id")
        .lean();
      if (!sender) {
        throw new NotFoundError("Sender not found for unseen messages");
      }
      if (!userUnseenSenders.includes(sender._id.toString())) {
        userUnseenSenders = [...userUnseenSenders, sender._id.toString()];
      }
      if (userUnseenMessages[sender._id.toString()]) {
        userUnseenMessages[sender._id.toString()] =
          userUnseenMessages[sender._id.toString()] + 1;
      } else {
        userUnseenMessages[sender._id.toString()] = 1;
      }
    }

    res.status(StatusCodes.OK).json({
      messages: userUnseenMessages,
      senders: userUnseenSenders,
    });
  }
  if (role === "admin") {
    const { chatId } = req.body;

    if (!chatId) {
      throw new BadRequestError("Please provide required data");
    }

    const unseenMessages = await Chat.find({
      recipient: chatId,
      seenAt: null,
      isDeleted: false,
      archived: false,
    }).lean();
    if (!unseenMessages || unseenMessages.length === 0) {
      return res.status(StatusCodes.OK).json({
        messages: {},
        senders: [],
      });
    }
    let adminUnseenMessages = {};
    let adminUnseenSenders = [];
    for (let i = 0; i < unseenMessages.length; i++) {
      const sender = await User.findOne({ _id: unseenMessages[i].sender })
        .select("_id")
        .lean();
      if (!sender) {
        throw new NotFoundError("Sender not found for unseen messages");
      }
      if (!adminUnseenSenders.includes(sender._id.toString())) {
        adminUnseenSenders = [...adminUnseenSenders, sender._id.toString()];
      }
      if (adminUnseenMessages[sender._id.toString()]) {
        adminUnseenMessages[sender._id.toString()] =
          adminUnseenMessages[sender._id.toString()] + 1;
      } else {
        adminUnseenMessages[sender._id.toString()] = 1;
      }
    }
    res.status(StatusCodes.OK).json({
      messages: adminUnseenMessages,
      senders: adminUnseenSenders,
    });
  }
};

const getSingleMessage = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user" || role === "owner" || role === "companyOwner") {
    const userSelectedFields = "-isDeleted -archived -__v";
    const message = await Chat.findOne({
      _id: id,
      $or: [{ sender: userId }, { recipient: userId }],
      isDeleted: false,
      archived: false,
    })
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "sender",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      })
      .populate({
        path: "recipient",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      });
    if (!message) {
      throw new NotFoundError(
        "Message not found or you do not have permission to view it"
      );
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
  if (role === "admin") {
    let { select } = req.query;
    if (!select) {
      select = "-__v";
    } else {
      select = select.split(",").join(" ");
    }

    const message = await Chat.findOne({
      _id: id,
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
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user" || role === "owner" || role === "companyOwner") {
    const message = await Chat.findOneAndUpdate(
      {
        _id: id,
        sender: userId,
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
      }
    )
      .select("recipient")
      .lean();
    if (!message) {
      throw new NotFoundError(
        "Message not found or you do not have permission to delete it"
      );
    }
    if (chatOnlineUsers[message.recipient]) {
      chatNamespace
        .to(chatOnlineUsers[message.recipient])
        .emit("individualMessageDeleted", {
          messageId: id,
          sender: userId,
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
      if (select.match(/-recipient/)) {
        throw new BadRequestError(
          "You cannot remove recipient field from the response"
        );
      }
    } else {
      select = "-__v";
    }
    const message = await Chat.findOneAndUpdate(
      {
        _id: id,
      },
      {
        isDeleted: true,
        archived: true,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(select)
      .lean();
    if (!message) {
      throw new NotFoundError("Message not found");
    }
    if (chatOnlineUsers[message.recipient]) {
      chatNamespace
        .to(chatOnlineUsers[message.recipient])
        .emit("individualMessageDeleted", {
          messageId: id,
          sender: message.sender,
        });
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
};

const markMessageSeen = async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.user;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  if (role === "user" || role === "owner" || role === "companyOwner") {
    const userSelectedFields = "-isDeleted -archived -__v";
    const message = await Chat.findOneAndUpdate(
      {
        sender: id,
        recipient: userId,
        seenAt: null,
        isDeleted: false,
        archived: false,
      },
      {
        seenAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(userSelectedFields)
      .lean()
      .populate({
        path: "sender",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      })
      .populate({
        path: "recipient",
        select:
          "_id name profilePicture email school age friends goalKeeper phoneNumber description",
      });

    if (!message) {
      throw new NotFoundError(
        "Messages not found or you do not have permission to mark it as seen"
      );
    }
    if (chatOnlineUsers[id]) {
      chatNamespace.to(chatOnlineUsers[id]).emit("individualMessageSeen", {
        userId: userId,
      });
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
  if (role === "admin") {
    const { chatId } = req.body;
    let { select } = req.query;

    if (!chatId) {
      throw new BadRequestError("Please provide required data");
    }
    if (select) {
      select = select.split(",").join(" ");
    } else {
      select = "-__v";
    }
    const message = await Chat.findOneAndUpdate(
      {
        sender: id,
        seenAt: null,
        recipient: chatId,
      },
      {
        seenAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select(select)
      .lean();
    if (!message) {
      throw new NotFoundError("Messages not found");
    }
    if (chatOnlineUsers[id]) {
      chatNamespace.to(chatOnlineUsers[id]).emit("individualMessageSeen", {
        userId: chatId,
      });
    }
    res.status(StatusCodes.OK).json({
      message,
    });
  }
};

const deleteMessage = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data");
  }
  const message = await Chat.findOne({
    _id: id,
  });
  if (!message) {
    throw new NotFoundError("Message not found");
  }

  if (
    message.attachments &&
    message.attachments.items &&
    message.attachments.items.length > 0
  ) {
    for (const item of message.attachments.items) {
      await cloudinary.uploader.destroy(item.public.id);
    }
  }

  await Chat.findOneAndDelete({
    _id: id,
  });
  if (message.isDeleted) {
    return res.status(StatusCodes.NO_CONTENT).json({
      message: "Message deleted successfully",
    });
  } else {
    if (chatOnlineUsers[message.recipient]) {
      chatNamespace
        .to(chatOnlineUsers[message.recipient])
        .emit("individualMessageDeleted", {
          messageId: id,
          sender: message.sender,
        });
    }

    res.status(StatusCodes.NO_CONTENT).json({
      message: "Message deleted successfully",
    });
  }
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
