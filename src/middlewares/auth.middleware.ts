import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Get access token from cookies
    const token = req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // ✅ Verify token
    const decoded = verifyAccessToken(token) as { id: string; email: string };

    // ✅ Check user exists and is verified
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isEmailVerified) {
      return res.status(401).json({ error: "Invalid or unverified account" });
    }

    // ✅ Attach user to request
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired access token" });
  }
};
