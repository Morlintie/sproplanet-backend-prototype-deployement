const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    mimeType: { type: String }, // image/png, video/mp4 …
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
    attachments: [attachmentSchema],

    /* read receipts — store ONLY who has *not* seen to keep arrays short */
    notSeenBy: [{ type: mongoose.Types.ObjectId, ref: "User", index: true }],
    isDeleted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },

  { timestamps: true }
);

/* chronological fetch */
messageSchema.index({ advert: 1, createdAt: 1 });

/* “unread for user X in advert Y” */
messageSchema.index({ advert: 1, notSeenBy: 1 });

const AdvertChatMessage = mongoose.model("AdvertChatMessage", messageSchema);

module.exports = AdvertChatMessage;
