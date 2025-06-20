const express = require("express");
const {
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
} = require("../controllers/pitchReviewController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const passUserInfoMiddleware = require("../middlewares/passUserInfoMiddleware");
const router = express.Router();

router.post("/", authenticationMiddleware, createReview);
router.get(
  "/",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  getAllReviews
);
router.get("/next", passUserInfoMiddleware, getNextReviews);
router.get("/user", passUserInfoMiddleware, getUserReviews);
router.get("/:id", passUserInfoMiddleware, getReview);
router.get(
  "/company/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin", "owner");
  },
  getCompanyReviews
);

router.patch("/multiple", updateMultipleReviews);
router.patch("/:id", authenticationMiddleware, updateReview);
router.post("/insertImage/:id", insertImages);
router.delete("/deleteImage/:id", deleteImages);
router.post("/reply/:id", replyReview);
router.patch("/editReply/:id", editReply);
router.delete("/deleteReply/:id", deleteReply);
router.post("/like/:id", likeReview);
router.post("/dislike/:id", dislikeReview);

router.delete("/deleteMany", deleteManyReviews);
router.delete("/:id", deleteReview);

module.exports = router;
