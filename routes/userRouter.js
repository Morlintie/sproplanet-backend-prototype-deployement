const express = require("express");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const router = express.Router();

router.get("/getMany"); // no auth, index search
router.get("/getSingle:id"); // no Auth
router.get("/show:id"); // auth admin
router.get("/getManyGoalkeeper"); // no auth, index search (delete the index and create again at bash or powershell)
router.get("/getManyBanned"); // admin only, query
router.get("/getManyDeleted"); // admin only, query

router.patch("/updateMany"); // admin only, query
router.patch("/updateSingle:id"); // auth, admin
router.patch("/updatePassword:id"); // auth > email, admin
router.patch("/deleteSingle:id"); // auth > email, admin
router.patch("/deleteMany"); // admin only, query

router.delete("/deleteMany"); // admin only, query
router.delete("/deleteSingle:id"); // admin only
