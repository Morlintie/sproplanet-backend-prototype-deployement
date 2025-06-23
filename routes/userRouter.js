const express = require("express");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const passUserInfoMiddleware = require("../middlewares/passUserInfoMiddleware");
const {
  getManyUser,
  getSingleUser,
  showUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteUserRequest,
  checkDeletionCode,
  updateDeleteUser,
  deleteManyUser,
  getByGoogleId,
  sendFriendRequest,
  replyFriendRequest,
  requestPasswordChange,
  checkPasswordCode,
  resetPassword,
  revokeSelfFriendRequest,
  exitFromFriends,
  getAdmin,
  deleteRecentlySearchedUser,
  deleteRecentlySearchedPitch,
  removeFromFriends,
} = require("../controllers/userController");
const router = express.Router();

router.get("/getMany", passUserInfoMiddleware, getManyUser); // no auth, index search
router.get(
  "/getAdmin",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  getAdmin
);
router.get("/getSingle:id", passUserInfoMiddleware, getSingleUser); // no Auth
router.get("/show", authenticationMiddleware, showUser); // auth admin
router.get("/getManyGoalkeeper", passUserInfoMiddleware, getManyGoalkeeper); // no auth, index search
router.get(
  "/getGoogleUser:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  getByGoogleId
); //admin only

router.post(
  "/sendFriendRequest:id",
  authenticationMiddleware,
  sendFriendRequest
); //auth , admin

router.post(
  "/requestPassword",
  authenticationMiddleware,
  requestPasswordChange
); // auth > email, admin
router.post("/checkPassword", authenticationMiddleware, checkPasswordCode); // auth, admin
router.post(
  "/userDeleteRequest",
  authenticationMiddleware,
  updateDeleteUserRequest
);
router.post("/checkDeletion", authenticationMiddleware, checkDeletionCode);

router.patch("/resetPassword", authenticationMiddleware, resetPassword); // auth, admin

router.patch(
  "/updateMany",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  updateManyUser
); // admin only, query
router.patch(
  "/replyFriendRequest:id",
  authenticationMiddleware,
  replyFriendRequest
); // auth, admin
router.patch("/updateSingle", authenticationMiddleware, updateSingleUser); // auth, admin
router.patch(
  "/updatePassword:id",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  updatePasswordUser
); //  admin

router.patch("/updateDeleteUser", authenticationMiddleware, updateDeleteUser);

router.delete(
  "/removeFromFriends:id",
  authenticationMiddleware,
  removeFromFriends
);

router.delete(
  "/deleteMany",
  (req, res, next) => {
    roleMiddleware(req, res, next, "admin");
  },
  deleteManyUser
);
router.delete(
  "/revokeFriendRequest:id",
  authenticationMiddleware,
  revokeSelfFriendRequest
); //auth, admin
router.delete("/exitFromFriends:id", authenticationMiddleware, exitFromFriends); // auth, admin
router.delete(
  "/deleteRecentlySearchedUser:id",
  authenticationMiddleware,
  deleteRecentlySearchedUser
);
router.delete(
  "/deleteRecentlySearchedPitch:id",
  authenticationMiddleware,
  deleteRecentlySearchedPitch
);

module.exports = router;
