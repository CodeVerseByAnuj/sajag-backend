import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";
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
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = verifyToken(token) as { id: string; email: string };

    // Verify user still exists and is verified
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isEmailVerified) {
      return res.status(401).json({ error: "Invalid or unverified account" });
    }

    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
