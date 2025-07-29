const Pitch = require("../models/Pitch");
const PitchReview = require("../models/PitchReview");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../errors");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const {
  adminPitchReviewQuery,
  adminPitchReviewUpdateQuery,
} = require("../utils");

const createReview = async (req, res) => {
  const { pitchId, rating, title, comment, photos } = req.body;
  const { userId } = req.user;

  const pitch = await Pitch.findOne({ _id: pitchId }).lean();
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  const companyId = pitch.company;
  let uploadedPhotos = [];
  if (photos) {
    if (photos.length > 3) {
      throw new BadRequestError("You can only upload up to 3 photos.");
    }

    if (photos) {
      for (const photo of photos) {
        if (!photo.mimetype.startsWith("image/")) {
          throw new BadRequestError("Only image files are allowed.");
        }
        if (photo.size > 1024 * 1024 * 5) {
          throw new BadRequestError("Image size should not exceed 5MB.");
        }
        const result = await cloudinary.uploader.upload(photo.tempFilePath, {
          folder: "pitch-reviews",
          use_filename: true,
        });
        await fs.unlink(photo.tempFilePath);
        uploadedPhotos.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }
  }

  const review = await PitchReview.create({
    pitch: pitchId,
    company: companyId,
    user: userId,
    rating,
    title,
    comment,
    photos: uploadedPhotos,
  });

  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  let { sort, select } = req.query;
  const queryObject = adminPitchReviewQuery(req);
  if (sort) {
    sort = sort.split(",").join(" ");
  } else {
    sort = "-createdAt";
  }
  if (select) {
    select = select.split(",").join(" ");
  }
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) || 500;
  const skip = (page - 1) * limit;
  const reviews = await PitchReview.find(queryObject)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    });
  if (!reviews && reviews.length === 0) {
    throw new NotFoundError("No reviews found.");
  }
  const totalReviews = await PitchReview.countDocuments();
  res
    .status(StatusCodes.OK)
    .json({ reviews, totalReviews, count: reviews.length, limit });
};

const getNextReviews = async (req, res) => {
  const { pitchId, page } = req.body;
  if (!pitchId || !page || page <= 1) {
    throw new BadRequestError("Please provide all required data.");
  }
  const limit = 10;
  const skip = (parseInt(page) - 1) * limit;
  const reviews = await PitchReview.find({ pitch: pitchId, isDeleted: false })
    .sort("-createdAt -rating")
    .skip(skip)
    .limit(limit)
    .lean()
    .select("-__v -isDeleted -archived")
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    });
  if (!reviews || reviews.length === 0) {
    throw new NotFoundError("No reviews found.");
  }
  const totalReviews = await PitchReview.countDocuments({ pitch: pitchId });

  res.status(StatusCodes.OK).json({
    reviews,
    totalReviews,
    count: reviews.length,
    limit,
    page: parseInt(page),
  });
};

const getReview = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide review id.");
  }
  const review = await PitchReview.findOne({ _id: id, isDeleted: false })
    .lean()
    .select("-__v -isDeleted -archived")
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    });
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  res.status(StatusCodes.OK).json({ review });
};

const getCompanyReviews = async (req, res) => {
  const { role } = req.user;
  if (role === "owner") {
    const { companyId } = req.user;
    let { sort } = req.query;
    if (sort) {
      sort = sort.split(",").join(" ");
    } else {
      sort = "-createdAt -rating";
    }
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const reviews = await PitchReview.find({
      company: companyId,
      isDeleted: false,
    })
      .sort(sort)
      .skip(skip)
      .select("-__v -isDeleted -archived")
      .limit(limit)
      .lean()
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });
    if (!reviews || reviews.length === 0) {
      throw new NotFoundError("No reviews found.");
    }
    const totalReviews = await PitchReview.countDocuments({
      company: companyId,
    });
    res.status(StatusCodes.OK).json({
      reviews,
      totalReviews,
      count: reviews.length,
      limit,
    });
  }
  if (role === "admin") {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide required data.");
    }
    let { sort, select } = req.query;
    if (sort) {
      sort = sort.split(",".join(" "));
    } else {
      sort = "-createdAt -rating";
    }
    if (select) {
      select = select.split(",").join(" ");
    }
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const reviews = await PitchReview.find({ company: id })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .lean()
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });
    if (!reviews || reviews.length === 0) {
      throw new NotFoundError("No reviews found.");
    }
    const totalReviews = await PitchReview.countDocuments({ company: id });
    res
      .status(StatusCodes.OK)
      .json({ reviews, totalReviews, count: reviews.length, limit });
  }
};

const getUserReviews = async (req, res) => {
  const { userId } = req.user;
  let { sort } = req.query;
  if (sort) {
    sort = sort.split(",").join(" ");
  } else {
    sort = "-createdAt -rating";
  }
  const limit = parseInt(req.query.limit) || 50;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;
  const reviews = await PitchReview.find({ user: userId, isDeleted: false })
    .sort(sort)
    .limit(limit)
    .select("-__v -isDeleted -archived")
    .skip(skip)
    .lean()
    .populate({ path: "user", select: "name profilePicture email _id" })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    });
  if (!reviews || reviews.length === 0) {
    throw new NotFoundError("No reviews found.");
  }
  const totalReviews = await PitchReview.countDocuments({ user: userId });
  res
    .status(StatusCodes.OK)
    .json({ reviews, totalReviews, count: reviews.length, limit });
};

const updateReview = async (req, res) => {
  const { id } = req.params;
  const { title, comment, rating } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }

  const preReview = await PitchReview.findOne({ _id: id }).lean();
  if (!preReview) {
    throw new NotFoundError("Review not found.");
  }
  if (
    preReview.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  const update = {
    title,
    comment,
    rating,
  };
  Object.keys(update).forEach((key) => {
    if (update[key] === undefined || update[key] === null) {
      delete update[key];
    }
  });
  if (Object.keys(update).length > 0) {
    update.isEdited = true;
  }
  const review = await PitchReview.findOneAndUpdate(
    { _id: id, isDeleted: false },
    update,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    })
    .select("-__v -isDeleted -archived");

  res.status(StatusCodes.OK).json({ review });
};

const updateAdminReview = async (req, res) => {
  const { id } = req.params;
  const updateQuery = adminPitchReviewUpdateQuery(req);
  if (!id) {
    throw new BadRequestError("Please provide all required data.");
  }

  const review = await PitchReview.findOneAndUpdate({ _id: id }, updateQuery, {
    new: true,
    runValidators: true,
  });
  if (!review) {
    throw new NotFoundError("Review not found");
  }
  res.status(StatusCodes.OK).json({ review });
};

const insertImages = async (req, res) => {
  const { id } = req.params;
  const { photos } = req.files;
  let photosArray = [];
  if (!Array.isArray(photos)) {
    photosArray = [photos];
  } else {
    photosArray = photos;
  }

  if (!id || !photos || photosArray.length === 0) {
    throw new BadRequestError("Please provide all required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (
    review.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  if (review.photos.length >= 3) {
    throw new BadRequestError("You can only upload up to 3 photos.");
  }

  let uploadedPhotos = [];
  for (const photo of photosArray) {
    if (!photo.mimetype.startsWith("image/")) {
      throw new BadRequestError("Only image files are allowed.");
    }
    if (photo.size > 1024 * 1024 * 5) {
      throw new BadRequestError("Image size should not exceed 5MB.");
    }
    const result = await cloudinary.uploader.upload(photo.tempFilePath, {
      folder: "pitch-reviews",
      use_filename: true,
    });
    await fs.unlink(photo.tempFilePath);
    uploadedPhotos.push({
      url: result.secure_url,
      public_id: result.public_id,
    });
  }
  const updatedReview = await PitchReview.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $push: { photos: { $each: uploadedPhotos } },
    },
    { new: true, runValidators: true }
  )
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    })
    .select("-__v -isDeleted -archived");
  res.status(StatusCodes.OK).json({ review: updatedReview });
};

const deleteImages = async (req, res) => {
  const { id } = req.params;
  const { public_id } = req.body;
  if (
    !id ||
    !public_id ||
    !Array.isArray(public_id) ||
    public_id.length === 0
  ) {
    throw new BadRequestError("Please provide all required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (
    review.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  const updatedPhotos = review.photos.filter((photo) =>
    public_id.includes(photo.public_id)
  );
  if (updatedPhotos.length <= 0) {
    throw new BadRequestError("No images found with teh provided public IDs.");
  }
  for (const photo of updatedPhotos) {
    await PitchReview.findOneAndUpdate(
      { _id: id },
      {
        $pull: { photos: { public_id: photo.public_id } },
      }
    );
    await cloudinary.uploader.destroy(photo.public_id, {
      folder: "pitch-reviews",
      use_filename: true,
    });
  }
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ message: "Images deleted successfully." });
};

const replyReview = async (req, res) => {
  const { comment } = req.body;
  const { id } = req.params;
  console.log(id);
  if (!id || !comment) {
    throw new BadRequestError("Please provide all required data.");
  }

  const review = await PitchReview.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $push: {
        replies: {
          user: req.user.userId,
          comment,
        },
      },
    },
    { new: true, runValidators: true }
  )
    .populate({ path: "user", select: "name profilePicture email _id" })
    .populate({ path: "replies.user", select: "name profilePicture email _id" })
    .select("-__v -isDeleted -archived");
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  res.status(StatusCodes.OK).json({ review });
};

const replyAdminReview = async (req, res) => {};

const editReply = async (req, res) => {
  const { id } = req.params;
  const { comment, replyId } = req.body;
  if (!id || !comment) {
    throw new BadRequestError("Please provide all required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
  if (!review) {
    throw new NotFoundError("Review not found.");
  }

  const reply = review.replies.find(
    (reply) => reply._id.toString() === replyId
  );
  if (!reply) {
    throw new NotFoundError("Reply not found.");
  }
  if (
    reply.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  const updatedReply = await PitchReview.findOneAndUpdate(
    {
      _id: id,
      "replies._id": replyId,
    },
    {
      "replies.$.comment": comment,
      "replies.$.isEdited": true,
      "replies.$.updatedAt": new Date(),
    },
    { new: true, runValidators: true }
  )
    .populate({
      path: "user",
      select: "name profilePicture email _id",
    })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    })
    .select("-__v -isDeleted -archived");
  res.status(StatusCodes.OK).json({ review: updatedReply });
};

const editReplies = async (req, res) => {
  const { id } = req.params;
  const {
    replyId,
    replyUser,
    replyComment,
    replyCreatedAt,
    replyUpdatedAt,
    replyIsEdited,
  } = req.body;
  const {
    updateUser,
    updateComment,
    updateCreatedAt,
    updateUpdatedAt,
    updateIsEdited,
  } = req.body;
  const replyQueryObject = {};
  const replyUpdateObject = {};
  if (replyId) {
    replyQueryObject["replies._id"] = replyId;
  }
  if (replyUser) {
    replyQueryObject["replies.user"] = replyUser;
  }
  if (replyComment) {
    replyQueryObject["replies.comment"] = {
      $regex: replyComment,
      $options: "i",
    };
  }
  if (replyCreatedAt) {
    const upperLimit = new Date(replyCreatedAt?.upperLimit);
    const lowerLimit = new Date(replyCreatedAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      replyQueryObject["replies.createdAt"] = {
        $gte: lowerLimit,
        $lte: upperLimit,
      };
    }
    if (upperLimit) {
      replyQueryObject["replies.createdAt"] = { $lte: upperLimit };
    }
    if (lowerLimit) {
      replyQueryObject["replies.createdAt"] = { $gte: lowerLimit };
    }
  }
  if (replyUpdatedAt) {
    const upperLimit = new Date(replyUpdatedAt?.upperLimit);
    const lowerLimit = new Date(replyUpdatedAt?.lowerLimit);
    if (upperLimit && lowerLimit) {
      replyQueryObject["replies.updatedAt"] = {
        $gte: lowerLimit,
        $lte: upperLimit,
      };
    }
    if (upperLimit) {
      replyQueryObject["replies.updatedAt"] = { $lte: upperLimit };
    }
    if (lowerLimit) {
      replyQueryObject["replies.updatedAt"] = { $gte: lowerLimit };
    }
  }
  if (replyIsEdited) {
    if (replyIsEdited === "true") {
      replyQueryObject["replies.isEdited"] = true;
    } else if (replyIsEdited === "false") {
      replyQueryObject["replies.isEdited"] = false;
    }
  }

  if (updateUser) {
    replyUpdateObject["replies.$.user"] = updateUser;
  }
  if (updateComment) {
    replyUpdateObject["replies.$.comment"] = updateComment;
  }
  if (updateCreatedAt) {
    replyUpdateObject["replies.$.createdAt"] = new Date(updateCreatedAt);
  }
  if (updateUpdatedAt) {
    replyUpdateObject["replies.$.updatedAt"] = new Date(updateUpdatedAt);
  }
  if (updateIsEdited) {
    if (updateIsEdited === "true") {
      replyUpdateObject["replies.$.isEdited"] = true;
    }
    if (updateIsEdited === "false") {
      replyUpdateObject["replies.$.isEdited"] = false;
    }
  }

  const reviews = await PitchReview.findOneAndUpdate(
    { _id: id, ...replyQueryObject },
    replyUpdateObject,
    { new: true, runValidators: true }
  )
    .populate({ path: "user", select: "name profilePicture email _id" })
    .populate({
      path: "replies.user",
      select: "name profilePicture email _id",
    });
  if (!reviews || reviews.length === 0) {
    throw new NotFoundError("No review found.");
  }
  res.status(StatusCodes.OK).json({ reviews });
};

const deleteReply = async (req, res) => {
  const { id } = req.params;
  const { replyId } = req.body;
  if (!id || !replyId) {
    throw new BadRequestError("Please provide all required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
    "replies._id": replyId,
  }).lean();
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (
    review.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  await PitchReview.findOneAndUpdate(
    { _id: id, "replies._id": replyId, isDeleted: false },
    { $pull: { replies: { _id: replyId } } },
    { new: true, runValidators: true }
  );
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ message: "Reply deleted successfully." });
};

const likeReview = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (review.likes.includes(new mongoose.Types.ObjectId(req.user.userId))) {
    const review = await PitchReview.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $pull: { likes: req.user.userId } },
      { new: true, runValidators: true }
    )
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });
    res.status(StatusCodes.OK).json({ review });
  } else {
    const review = await PitchReview.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $addToSet: { likes: req.user.userId },
        $pull: { dislike: req.user.userId },
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });
    res.status(StatusCodes.OK).json({ review });
  }
};

const dislikeReview = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  });
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (review.dislikes.includes(new mongoose.Types.ObjectId(req.user.userId))) {
    const review = await PitchReview.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $pull: { dislikes: req.user.userId } },
      { new: true, runValidators: true }
    )
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });
    res.status(StatusCodes.OK).json({ review });
  } else {
    const review = await PitchReview.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $addToSet: { dislikes: req.user.userId },
        $pull: { likes: req.user.userId },
      },
      { new: true, runValidators: true }
    )
      .populate({
        path: "user",
        select: "name profilePicture email _id",
      })
      .populate({
        path: "replies.user",
        select: "name profilePicture email _id",
      });

    res.status(StatusCodes.OK).json({ review });
  }
};

const deleteReview = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
    isDeleted: false,
  }).lean();
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  if (
    review.user.toString() !== req.user.userId.toString() &&
    req.user.role !== "admin"
  ) {
    throw new UnauthorizedError(
      "You are not authorized to perform that action."
    );
  }
  await PitchReview.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      isDeleted: true,
      archived: true,
      archivedRating: review.rating,
      rating: 0,
    },
    { new: true, runValidators: true }
  );
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ message: "Review deleted successfully." });
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new BadRequestError("Please provide required data.");
  }
  const review = await PitchReview.findOne({
    _id: id,
  });
  if (!review) {
    throw new NotFoundError("Review not found.");
  }
  await review.deleteOne();
  res
    .status(StatusCodes.NO_CONTENT)
    .json({ message: "Review deleted successfully." });
};

module.exports = {
  createReview,
  getAllReviews,
  getReview,
  getCompanyReviews,
  updateReview,

  insertImages,
  deleteImages,
  replyReview,
  editReply,
  deleteReply,
  likeReview,
  dislikeReview,
  deleteReview,
  deleteAdmin,
  getNextReviews,
  getUserReviews,
  editReplies,
  updateAdminReview,
};
