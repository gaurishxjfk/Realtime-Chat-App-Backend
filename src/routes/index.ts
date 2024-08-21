import express from "express";
import {
  createMessage,
  createUser,
  getallUser,
  getMessagesBetweenUsers,
  getParticipants,
  loginUser,
} from "../controller/user";
const router = express.Router();

router.get("/", getallUser);
router.post("/create", createUser);
router.post("/login", loginUser);

router.post("/createmessage", createMessage);

router.get("/fetchchats/:senderId/:receiverID", getMessagesBetweenUsers);
router.get("/fetchparticipants/:senderId", getParticipants);

export default router;
