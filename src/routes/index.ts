import express from "express";
import {
  createMessage,
  createUser,
  getallUser,
  getMessagesBetweenUsers,
  getParticipants,
  loginUser,
} from "../controller/user";
import multer from "multer";
const router = express.Router();

// Configure multer
const upload = multer({ dest: 'uploads/' });
upload.single('image'),

router.get("/", getallUser);
router.post("/create", createUser);
router.post("/login", loginUser);

router.post("/createmessage", upload.single('image'), createMessage);

router.get("/fetchchats/:senderId/:receiverID", getMessagesBetweenUsers);
router.get("/fetchparticipants/:senderId", getParticipants);

export default router;
