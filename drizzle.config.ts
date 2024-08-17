import { defineConfig } from 'drizzle-kit'
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  dialect: 'postgresql',
  migrations: {
    prefix: 'supabase'
  },
  dbCredentials: {
    url: process.env.DATABASE_URL || ''
  }
})