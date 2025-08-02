import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { applyPayment, getPaymentHistory, calculateStandaloneInterest } from "../services/payment.service";
import { sendSuccessResponse } from "../utils/sendSuccessResponse";

const paymentSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  amountPaid: z.number().positive("Amount paid must be greater than zero"),
});

const calculateInterestSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  startDate: z.string().min(1, "Start date is required").refine((date) => !isNaN(Date.parse(date)), {
    message: "Start date must be a valid date"
  }),
  endDate: z.string().min(1, "End date is required").refine((date) => !isNaN(Date.parse(date)), {
    message: "End date must be a valid date"
  }),
  percentage: z.number().positive("Monthly interest rate must be greater than zero"),
});

export class PaymentController {
  async calculateInterest(req: AuthRequest, res: Response) {
    try {
      // Debug: Log the request body
      console.log("Request body:", req.body);
      
      const { amount, startDate, endDate, percentage } = calculateInterestSchema.parse(req.body);
      
      // Convert string dates to Date objects
      const fromDate = new Date(startDate);
      const toDate = new Date(endDate);
      
      // Validate that end date is after start date
      if (toDate <= fromDate) {
        return res.status(400).json({
          error: "End date must be after start date"
        });
      }
      
      console.log("Parsed interest calculation data:", { amount, startDate, endDate, percentage });

      const interest = calculateStandaloneInterest(amount, fromDate, toDate, percentage);
      
      // Calculate number of days for response
      const msInDay = 1000 * 60 * 60 * 24;
      const diffInDays = Math.floor((toDate.getTime() - fromDate.getTime()) / msInDay);
      
      // Calculate daily interest rate and amount for display
      const dailyRate = percentage / 30; // Monthly rate / 30 days
      const dailyInterest = (amount * dailyRate) / 100;

      return sendSuccessResponse(res, {
        amount,
        startDate,
        endDate,
        monthlyRate: percentage,
        yearlyRate: percentage * 12, // Show yearly equivalent
        dailyRate: Math.round(dailyRate * 10000) / 10000, // Round to 4 decimal places
        dailyInterest: Math.round(dailyInterest * 100) / 100, // Round to 2 decimal places
        daysCalculated: diffInDays,
        interest,
        totalAmount: amount + interest
      }, "Interest calculated successfully");
    } catch (error: any) {
      if (error.name === "ZodError") {  
        console.log("Validation error details:", error.errors);
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,  
        });
      }
      console.error("Interest calculation error:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }
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
