import crypto from "crypto";
import { env } from "../config/env";

const algorithm = "aes-256-cbc";
const key = Buffer.from(env.ENCRYPTION_KEY, "utf8");

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (encryptedData: string): string => {
  const parts = encryptedData.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encrypted = parts.join(":");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
