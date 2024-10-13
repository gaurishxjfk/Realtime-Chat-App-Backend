import { Request, Response } from "express";
import "dotenv/config";
import { db } from "../db/db";
import { chats, users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { and, desc, eq, lt, ne, or } from "drizzle-orm";
import { getReceiverSocketId, io } from "../socket/socket";
import { uploadFile } from "./supabase";

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

    const finalAllUser = await Promise.all(
      allUsers.map(async (user) => {
        const lastMessage = await db
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
            and(
              or(
                and(eq(chats.senderId, user.user_id), eq(chats.receiverId, senderId)),
                and(eq(chats.senderId, senderId), eq(chats.receiverId, user.user_id))
              )
            )
          )
          .orderBy(desc(chats.createdAt))
          .limit(1);

        // Return the user object combined with the last message (if it exists)
        return { ...user, ...(lastMessage[0] || {}) };
      })
    );
    res.status(200).json(finalAllUser);
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

    // Check if the user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      const foundUser = existingUser[0];

      // Verify the password for existing user
      const isPasswordValid = await verifyPassword(
        password,
        foundUser.passwordHash
      );

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Successful login for existing user
      return res.status(200).json({
        message: "User logged in successfully",
        id: foundUser.userId,
        username: foundUser.username,
        email: foundUser.email,
      });
    }

    // If user doesn't exist, create a new user
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      username,
      email,
      passwordHash,
    });

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during user creation or login:", error);
    return res.status(500).json({ error: "Internal Server Error" });
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
    const { senderId, recieverId, content, messageType } = req.body;
    console.log(senderId, recieverId, content, messageType);

    if (!senderId || !content) {
      return res
        .status(400)
        .json({ error: "Sender ID and content are required" });
    }
    const publicUrl: string | null =
      messageType === "text" ? null : await uploadFile(req.file);

    const newMsg = await db
      .insert(chats)
      .values({
        senderId,
        receiverId: recieverId,
        content,
        messageType: messageType || "text",
        mediaUrl: publicUrl ?? null,
      })
      .returning();

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
          and(eq(chats.senderId, recieverId), eq(chats.receiverId, senderId)),
          and(eq(chats.senderId, senderId), eq(chats.receiverId, recieverId))
        )
      )
      .orderBy(desc(chats.createdAt))
      .limit(8);

    // socket io functionality
    const receiverSocketId = getReceiverSocketId(recieverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", ...newMsg);
    }

    res.status(201).json({
      message: "Message created successfully",
      body: messagesList.slice().reverse(),
    });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

function isValidDate(dateString: string | number | Date) {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export const getMessagesBetweenUsers = async (req: Request, res: Response) => {
  const { senderId, receiverID } = req.params;
  const limit = req.query.limit
    ? parseInt(req.query.limit as string, 10) || 8
    : 8;
  // Parse the cursor for pagination (the timestamp of the oldest loaded message)
  const cursor =
    req.query.cursor !== "null" ? new Date(req.query.cursor as string) : false;

  console.log(cursor, "I m nand");
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
        and(
          or(
            and(eq(chats.senderId, receiverID), eq(chats.receiverId, senderId)),
            and(eq(chats.senderId, senderId), eq(chats.receiverId, receiverID))
          ),
          cursor ? lt(chats.createdAt, cursor) : undefined
        )
      )
      .orderBy(desc(chats.createdAt))
      .limit(limit);

    res.status(200).json({
      messages: messagesList.slice().reverse(), // Reverse messages to send in chronological order
      hasMore: messagesList.length === limit, // If we got less than limit, there are no more messages
      nextCursor:
        messagesList.length > 0
          ? messagesList[messagesList.length - 1].createdAt
          : null, // Send the next cursor
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
