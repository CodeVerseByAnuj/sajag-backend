import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string().transform(Number),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  ENCRYPTION_KEY: z.string().length(32),
  CLIENT_URL: z.string().default("http://210.79.129.252:3000"),
  PORT: z.string().transform(Number)
});

export const env = envSchema.parse(process.env);
