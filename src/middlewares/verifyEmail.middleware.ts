import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const requireEmailVerification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.isEmailVerified) {
      return res.status(403).json({
        error: "Email verification required",
        needsVerification: true,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
