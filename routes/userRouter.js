const express = require("express");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getManyUser,
  getSingleUser,
  showUser,
  getManyBannedUser,
  getManyDeletedUser,
  getManyGoalkeeper,
  updateManyUser,
  updateSingleUser,
  updatePasswordUser,
  updateDeleteSingleUser,
  updateDeleteManyUser,
  deleteSingleUser,
  deleteManyUser,
} = require("../controllers/userController");
const router = express.Router();

router.get("/getMany", getManyUser); // no auth, index search
router.get("/getSingle:id", getSingleUser); // no Auth
router.get("/show:id", authenticationMiddleware, showUser); // auth admin
router.get("/getManyGoalkeeper", getManyGoalkeeper); // no auth, index search
router.get("/getManyBanned", adminMiddleware, getManyBannedUser); // admin only, query
router.get("/getManyDeleted", adminMiddleware, getManyDeletedUser); // admin only, query

router.patch("/updateMany", adminMiddleware, updateManyUser); // admin only, query
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
