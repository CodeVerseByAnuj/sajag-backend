import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { generateAccessToken, generateRefreshToken ,verifyRefreshToken } from "../utils/jwt.util.js";
import { sendVerificationEmail } from "../utils/mail.util.js";

const prisma = new PrismaClient();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

export class AuthService {
  async register(email: string, password: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        emailVerifyToken: verificationToken,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return {
      message:
        "Registration successful. Please check your email for verification.",
      userId: user.id,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new Error(
        "Account is temporarily locked due to too many failed attempts",
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment login attempts
      const updates: any = { loginAttempts: user.loginAttempts + 1 };

      // Lock account if max attempts reached
      if (user.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
        updates.lockUntil = new Date(Date.now() + LOCK_TIME);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      throw new Error("Invalid credentials");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockUntil: null,
        },
      });
    }

    // Generate JWT token
    const payload = { id: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

   async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const payload = verifyRefreshToken(refreshToken) as { id: string; email: string };

    const newAccessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
    });

    return newAccessToken;
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new Error("Invalid verification token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    return { message: "Email verified successfully" };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email is already verified");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verificationToken },
    });

    await sendVerificationEmail(email, verificationToken);

    return { message: "Verification email sent" };
  }

   logout() {
    // No logic needed here for cookie-based logout unless you're blacklisting tokens
    return { message: "Logged out" };
  }
}
