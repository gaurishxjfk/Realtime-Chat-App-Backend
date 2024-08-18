import { Request, Response } from "express";
import { db } from "../db/db";
import { chats, messages, users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { and, eq, ne, or } from "drizzle-orm";

const hashPassword = (password: string) => bcrypt.hash(password, 10);
const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const getallUser = async (req: Request, res: Response) => {
  try {
    const allUsers = await db
      .select({
        username: users.username,
        email: users.email,
        user_id: users.userId,
        status: users.status,
        last_active_at: users.lastActiveAt,
      })
      .from(users);
    res.status(200).json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

export const getParticipants = async (req: Request, res: Response) => {
  const { senderId } = req.params;
  try {
    const allUsers = await db
      .selectDistinct({
        username: users.username,
        user_id: users.userId,
        status: users.status,
        last_active_at: users.lastActiveAt,
      })
      .from(users)
      .where(ne(users.userId, senderId));
    res.status(200).json(allUsers);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      username,
      email,
      passwordHash,
    });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)
      .execute();

    if (user.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const foundUser = user[0];

    const isPasswordValid = await verifyPassword(
      password,
      foundUser.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Successful login
    res.status(200).json({
      id: foundUser.userId,
      username: foundUser.username,
      email: foundUser.email,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { senderId, recieverId, content, messageType, mediaUrl } = req.body;

    if (!senderId || !content) {
      return res
        .status(400)
        .json({ error: "Sender ID and content are required" });
    }

    await db.insert(chats).values({
      senderId,
      receiverId: recieverId,
      content,
      messageType: messageType || "text",
      mediaUrl: mediaUrl || null,
    });

    res.status(201).json({ message: "Message created successfully" });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessagesBetweenUsers = async (req: Request, res: Response) => {
  const { senderId, receiverID } = req.params;

  try {
    const messagesList = await db
      .select({
        messageId: chats.chatId,
        senderId: chats.senderId,
        content: chats.content,
        messageType: chats.messageType,
        mediaUrl: chats.mediaUrl,
        createdAt: chats.createdAt,
        isRead: chats.isRead,
        isTyping: chats.isTyping,
      })
      .from(chats)
      .where(
        or(
          and(eq(chats.senderId, receiverID), eq(chats.receiverId, senderId)),
          and(eq(chats.senderId, senderId), eq(chats.receiverId, receiverID))
        )
      )
      .orderBy(chats.createdAt);

    res.status(200).json(messagesList);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
