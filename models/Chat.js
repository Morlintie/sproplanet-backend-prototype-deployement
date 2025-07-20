const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const { decryptMessage } = require("../utils");

const itemsSchema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    mimeType: { type: String, required: true }, // image/png, video/mp4 …
  },
  {
    _id: false,
  }
);

const attachmentSchema = new Schema(
  {
    items: { type: [itemsSchema], required: true },

    caption: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false }
);

const directMessageSchema = new Schema(
  {
    sender: { type: Types.ObjectId, ref: "User", required: true, index: true },
    recipient: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* quick sharding key:  "smallerId_biggerId"  */
    conversationKey: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: ["text", "image", "video", "system"],
      default: "text",
    },
    content: { type: String, trim: true, maxlength: 2000 },
    attachments: attachmentSchema,

    /* read receipt */
    seenAt: { type: Date, default: null }, // null → unseen by recipient
    isDeleted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

directMessageSchema.index({ conversationKey: 1, createdAt: 1 });

directMessageSchema.index({ recipient: 1, seenAt: 1 });

/* derive conversationKey automatically */
directMessageSchema.pre("validate", function (next) {
  const [a, b] = [this.sender.toString(), this.recipient.toString()].sort();
  this.conversationKey = `${a}_${b}`;
  next();
});

/* convenience virtual */
directMessageSchema.virtual("isSeen").get(function () {
  return !!this.seenAt;
});

directMessageSchema.post("find", function (docs) {
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
});

directMessageSchema.post("findOne", function (doc) {
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

directMessageSchema.post("findOneAndUpdate", function (doc) {
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

const Chat = mongoose.model("ChatMessage", directMessageSchema);

module.exports = Chat;
