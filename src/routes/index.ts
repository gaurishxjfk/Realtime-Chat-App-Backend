import express from "express";
import { createMessage, createUser, getallUser, loginUser } from "../controller/user";
const router = express.Router();

router.get("/", getallUser);
router.post("/create", createUser);
router.post("/login", loginUser);

router.post("/createmessage", createMessage);

export default router;
