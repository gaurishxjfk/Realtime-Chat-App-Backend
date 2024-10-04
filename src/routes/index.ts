import express from "express";
import {
  createMessage,
  createSession,
  createUser,
  getallUser,
  getMessagesBetweenUsers,
  getParticipants,
  getUsersRoomId,
  loginUser,
} from "../controller/user";
const router = express.Router();

router.get("/", getallUser);
router.post("/create", createUser);
router.post("/login", loginUser);

router.post("/create/session", createSession);

router.post("/createmessage", createMessage);

router.get("/fetchchats/:senderId/:receiverID", getMessagesBetweenUsers);
router.get("/fetchparticipants/:senderId", getParticipants);
router.get("/fetchroomid/:receiverID", getUsersRoomId);


export default router;
