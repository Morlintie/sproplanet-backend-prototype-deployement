const Pitch = require("../models/Pitch");
const PitchReview = require("../models/PitchReview");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../errors");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("cloudinary").v2;
const fs = require("fs/promises");
const { adminPitchReviewQuery } = require("../utils");

const createReview = async (req, res) => {
  const { pitchId, rating, title, comment } = req.body;
  const { userId } = req.user;
  const photos = req.files?.photos;
  const pitch = await Pitch.findOne({ _id: pitchId }).lean();
  if (!pitch) {
    throw new NotFoundError("Pitch not found.");
  }
  const companyId = pitch.company;

  if (photos?.length > 3) {
    throw new BadRequestError("You can only upload up to 3 photos.");
  }
  let uploadedPhotos = [];
  if (photos) {
    for (const photo of photos) {
      const result = await cloudinary.uploader.upload(photo.tempFilePath, {
        folder: "pitch-reviews",
        use_filename: true,
      });
      await fs.unlink(photo.tempFilePath);
      uploadedPhotos.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
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
    .lean();
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
  const reviews = await PitchReview.find({ pitch: pitchId })
    .sort("-createdAt -rating")
    .skip(skip)
    .limit(limit)
    .lean();
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
  const review = await PitchReview.findOne({ _id: id }).lean();
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

    const reviews = await PitchReview.find({ company: companyId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
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
      .lean();
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
  res.send("Get user reviews");
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
  const review = await PitchReview.findOneAndUpdate({ _id: id }, update, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ review });
};

const updateMultipleReviews = async (req, res) => {
  res.send("Update multiple reviews");
};

const insertImages = async (req, res) => {
  res.send("Insert image into review");
};

const deleteImages = async (req, res) => {
  res.send("Delete image from review");
};

const replyReview = async (req, res) => {
  res.send("Reply to a review");
};

const editReply = async (req, res) => {
  res.send("Edit reply to a review");
};

const deleteReply = async (req, res) => {
  res.send("Delete reply to a review");
};

const likeReview = async (req, res) => {
  res.send("Like a review");
};

const dislikeReview = async (req, res) => {
  res.send("Dislike a review");
};

const deleteReview = async (req, res) => {
  res.send("Delete review by id");
};

const deleteManyReviews = async (req, res) => {
  res.send("Delete multiple reviews");
};

module.exports = {
  createReview,
  getAllReviews,
  getReview,
  getCompanyReviews,
  updateReview,
  updateMultipleReviews,
  insertImages,
  deleteImages,
  replyReview,
  editReply,
  deleteReply,
  likeReview,
  dislikeReview,
  deleteReview,
  deleteManyReviews,
  getNextReviews,
  getUserReviews,
};
