import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { env } from "./config/env.js";
import { generalLimiter } from "./middlewares/rateLimiter.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import itemRoutes from "./routes/item.route.js";// Initialize Prisma
import paymentRoutes from "./routes/payment.router.js";
import insightsRoutes from "./routes/insights.routes.js";


export const prisma = new PrismaClient();

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cookieParser()); // ✅ Required to access req.cookies
  app.use(
    cors({
      origin: [
        "https://sajagjewellers.in",
        "https://www.sajagjewellers.in",
        "http://localhost:3000"
      ],
      credentials: true,
    })
  );

  // Rate limiting
  // app.use(generalLimiter);

  // Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "Secure Backend API",
      version: "1.0.0",
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/customer", customerRoutes);
  app.use("/api/item", itemRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/insights", insightsRoutes);

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  // Error handling
  app.use(errorHandler);

  return app;
};
