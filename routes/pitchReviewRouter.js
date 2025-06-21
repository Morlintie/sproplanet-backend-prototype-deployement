const express = require("express");
const {
  createReview,
  getAllReviews,
  getReview,
  getCompanyReviews,
  updateReview,
  deleteAdmin,
  insertImages,
  deleteImages,
  replyReview,
  editReply,
  deleteReply,
  likeReview,
  dislikeReview,
  deleteReview,
  updateAdminReview,
  getNextReviews,
  getUserReviews,
  editReplies,
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

router.patch("/:id", authenticationMiddleware, updateReview);
router.post("/insertImage/:id", authenticationMiddleware, insertImages);
router.delete("/deleteImage/:id", authenticationMiddleware, deleteImages);
router.post("/reply/:id", authenticationMiddleware, replyReview);
router.patch("/editReply/:id", authenticationMiddleware, editReply);
router.patch(
  "/admin/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  updateAdminReview
);
router.patch(
  "/editReplies/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  editReplies
);
router.delete("/deleteReply/:id", authenticationMiddleware, deleteReply);
router.post("/like/:id", authenticationMiddleware, likeReview);
router.post("/dislike/:id", authenticationMiddleware, dislikeReview);
router.delete(
  "/admin/:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteAdmin
);
router.delete("/:id", authenticationMiddleware, deleteReview);

module.exports = router;
