import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { applyPayment, getPaymentHistory } from "../services/payment.service";
import { sendSuccessResponse } from "../utils/sendSuccessResponse";

const paymentSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  amountPaid: z.number().positive("Amount paid must be greater than zero"),
});

export class PaymentController {
  async makePayment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { itemId, amountPaid } = paymentSchema.parse(req.body);

      const result = await applyPayment(itemId, amountPaid);

      return sendSuccessResponse(res, result, "Payment applied successfully");
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      console.error("Payment error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }
  async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch payment history logic here
      const paymentHistory = await getPaymentHistory(req.params.itemId);
      // This is a placeholder, implement actual logic to fetch payment history

      return sendSuccessResponse(res, paymentHistory, "Payment history fetched successfully");
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }
}
