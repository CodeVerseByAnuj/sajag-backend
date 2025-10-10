import { Router } from "express";
import { InsightsController } from "../controllers/insights.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();
const insightsController = new InsightsController();

// All routes require authentication
router.use(authenticateToken);

// GET /api/insights - Get basic insights (total customers, total amount, total interest)
router.get("/", insightsController.getInsights.bind(insightsController));

// GET /api/insights/detailed - Get detailed insights with category breakdown and trends
router.get("/detailed", insightsController.getDetailedInsights.bind(insightsController));

export default router;