const mongoose = require("mongoose");
const { decryptMessage } = require("../utils");

const itemsSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    mimeType: { type: String, required: true },
  },
  {
    _id: false,
  }
);

const attachmentSchema = new mongoose.Schema(
  {
    items: { type: [itemsSchema], required: true },
    caption: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    advert: {
      type: mongoose.Types.ObjectId,
      ref: "Advert",
      required: true,
      index: true,
    },
    sender: { type: mongoose.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["text", "image", "video", "system"],
      default: "text",
    },
    content: { type: String, trim: true, maxlength: 2000 },
    attachments: attachmentSchema,

    /* read receipts — store ONLY who has *not* seen to keep arrays short */
    notSeenBy: [{ type: mongoose.Types.ObjectId, ref: "User", index: true }],
    isDeleted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },

  { timestamps: true }
);

messageSchema.index({ advert: 1, createdAt: 1 });

messageSchema.index({ advert: 1, notSeenBy: 1 });

messageSchema.post("find", function (docs) {
  if (docs) {
    docs.forEach((doc) => {
      if (doc.content) {
        doc.content = decryptMessage(doc.content);
      }
      if (doc.attachments) {
        if (doc.attachments.caption) {
          doc.attachments.caption = decryptMessage(doc.attachments.caption);
        }
        doc.attachments.items.forEach((item) => {
          item.url = decryptMessage(item.url);
        });
      }
    });
  }
});

messageSchema.post("findOne", function (doc) {
  if (doc) {
    if (doc.content) {
      doc.content = decryptMessage(doc.content);
    }
    if (doc.attachments) {
      if (doc.attachments.caption) {
        doc.attachments.caption = decryptMessage(doc.attachments.caption);
      }
      doc.attachments.items.forEach((item) => {
        item.url = decryptMessage(item.url);
      });
    }
  }
});

messageSchema.post("findOneAndUpdate", function (doc) {
  if (doc) {
    if (doc.content) {
      doc.content = decryptMessage(doc.content);
    }
    if (doc.attachments) {
      if (doc.attachments.caption) {
        doc.attachments.caption = decryptMessage(doc.attachments.caption);
      }
      doc.attachments.items.forEach((item) => {
        item.url = decryptMessage(item.url);
      });
    }
  }
});

const AdvertChatMessage = mongoose.model("AdvertChatMessage", messageSchema);

module.exports = AdvertChatMessage;
