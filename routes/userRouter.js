const express = require("express");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const passUserInfoMiddleware = require("../middlewares/passUserInfoMiddleware");
const {
  getManyUser,
  getSingleUser,
  showUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteSingleUser,
  updateDeleteManyUser,
  deleteSingleUser,
  deleteManyUser,
  getByGoogleId,
  sendFriendRequest,
  replyFriendRequest,
} = require("../controllers/userController");
const router = express.Router();

router.get("/getMany", passUserInfoMiddleware, getManyUser); // no auth, index search
router.get("/getSingle:id", passUserInfoMiddleware, getSingleUser); // no Auth
router.get("/show", authenticationMiddleware, showUser); // auth admin
router.get("/getManyGoalkeeper", passUserInfoMiddleware, getManyGoalkeeper); // no auth, index search
router.get("/getGoogleUser:id", adminMiddleware, getByGoogleId); //admin only

router.post(
  "/sendFriendRequest:id",
  authenticationMiddleware,
  sendFriendRequest
); //auth , admin

router.patch("/updateMany", adminMiddleware, updateManyUser); // admin only, query
router.patch(
  "/replyFriendRequest:id",
  authenticationMiddleware,
  replyFriendRequest
); // auth, admin
router.patch("/updateSingle:id", authenticationMiddleware, updateSingleUser); // auth, admin
router.patch(
  "/updatePassword:id",
  authenticationMiddleware,
  updatePasswordUser
); // auth > email, admin
router.patch(
  "/deleteSingle:id",
  authenticationMiddleware,
  updateDeleteSingleUser
); // auth > email, admin
router.patch("/deleteMany", adminMiddleware, updateDeleteManyUser); // admin only, query

router.delete("/deleteMany", adminMiddleware, deleteManyUser); // admin only, query
router.delete("/deleteSingle:id", adminMiddleware, deleteSingleUser); // admin only

module.exports = router;
