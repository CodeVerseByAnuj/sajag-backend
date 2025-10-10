import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { InsightsService } from "../services/insights.service.js";
import { sendSuccessResponse } from "../utils/sendSuccessResponse.js";

const insightsService = new InsightsService();

export class InsightsController {
  // GET /api/insights - Get basic insights
  async getInsights(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User ID not found"
        });
      }

      const insights = await insightsService.getInsights(userId);
      
      return sendSuccessResponse(res, insights, "Insights fetched successfully");
    } catch (error) {
      console.error("Error in getInsights:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // GET /api/insights/detailed - Get detailed insights with breakdown
  async getDetailedInsights(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User ID not found"
        });
      }

      const detailedInsights = await insightsService.getDetailedInsights(userId);
      
      return sendSuccessResponse(res, detailedInsights, "Detailed insights fetched successfully");
    } catch (error) {
      console.error("Error in getDetailedInsights:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}