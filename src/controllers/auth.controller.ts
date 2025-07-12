import { Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { setAuthCookies, setAccessTokenCookie, clearAuthCookies } from "../utils/cookieHelper.utils";

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

      // 🍪 Use cookie helper
      setAuthCookies(res, result.accessToken, result.refreshToken);

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

      // 🍪 Use helper to update access token only
      setAccessTokenCookie(res, newAccessToken);

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
      const result = authService.logout();

      // 🍪 Clear cookies using helper
      clearAuthCookies(res);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  }
}
