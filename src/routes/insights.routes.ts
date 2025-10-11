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

// GET /api/insights/monthly - Get monthly aggregates for charting (optional query ?months=12)
router.get("/monthly", insightsController.getMonthlyAggregates.bind(insightsController));

router.get("/daily", insightsController.getDailyAggregates.bind(insightsController));

export default router;