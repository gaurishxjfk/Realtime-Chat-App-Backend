
import { boolean, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    userId: uuid('user_id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    status: text('status').notNull().default('offline'),
    lastActiveAt: timestamp('last_active_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    profileImage: varchar('profile_image', { length: 255 })
  });

  export const messages = pgTable('messages', {
    messageId: uuid('message_id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id').references(() => users.userId).notNull(),
    content: text('content'),
    messageType: text('message_type').notNull().default('text'),
    mediaUrl: varchar('media_url', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    isRead: boolean('is_read').notNull().default(false),
    isTyping: boolean('is_typing').notNull().default(false),
  });

  export const chats = pgTable('chats', {
    chatId: uuid('chat_id').primaryKey().defaultRandom(),
    senderId: uuid('sender_id').references(() => users.userId).notNull(),
    receiverId: uuid('receiver_id').references(() => users.userId).notNull(),
    content: text('content'),
    messageType: text('message_type').notNull().default('text'),
    mediaUrl: varchar('media_url', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    isRead: boolean('is_read').notNull().default(false),
    isTyping: boolean('is_typing').notNull().default(false),
  });

  export const user_sessions = pgTable('user_sessions', {
    sessionId: uuid('session_id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.userId).notNull(),
    roomId: text('roomId'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  });
  
  