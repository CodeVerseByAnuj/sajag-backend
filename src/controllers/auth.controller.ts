import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const resendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password } = registerSchema.parse(req.body);

      const result = await authService.register(email, password);

      res.status(201).json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        error: error.message || "Registration failed",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const result = await authService.login(email, password);
      // 🍪 Set access and refresh tokens in secure cookies
      res.cookie("access_token", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: result.user });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(401).json({
        error: error.message || "Login failed",
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refresh_token;
      const newAccessToken = await authService.refreshAccessToken(refreshToken);

      res.cookie("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(403).json({ error: error.message || "Invalid refresh token" });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = verifyEmailSchema.parse(req.query);

      const result = await authService.verifyEmail(token);

      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        error: error.message || "Email verification failed",
      });
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = resendVerificationSchema.parse(req.body);

      const result = await authService.resendVerification(email);

      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        error: error.message || "Failed to resend verification",
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Call the logout service (useful if you extend it later)
      const result = authService.logout();

      // Clear cookies
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  }
}
