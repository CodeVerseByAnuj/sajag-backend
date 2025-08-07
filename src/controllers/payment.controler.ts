import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { applyPayment, getPaymentHistory, calculateStandaloneInterest, getCurrentInterestStatus } from "../services/payment.service";
import { sendSuccessResponse } from "../utils/sendSuccessResponse";

const paymentSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  interestAmount: z.number().min(0, "Interest amount must be non-negative"),
  principalAmount: z.number().min(0, "Principal amount must be non-negative"),
  paymentDate: z.string().min(1, "Payment date is required").refine((date) => !isNaN(Date.parse(date)), {
    message: "Payment date must be a valid date"
  }),
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

      const { itemId, interestAmount, principalAmount, paymentDate } = paymentSchema.parse(req.body);
      
      // Convert string date to Date object
      const parsedPaymentDate = new Date(paymentDate);
      
      // Calculate total amount paid
      const totalAmountPaid = interestAmount + principalAmount;

      const result = await applyPayment(itemId, interestAmount, principalAmount, parsedPaymentDate);

      // Enhanced response with detailed payment and interest information
      const responseData = {
        paymentId: result.paymentId,
        paymentDate: result.paymentDate,
        paymentAmount: totalAmountPaid,
        interestAmount: result.interestPaid,
        principalAmount: result.principalPaid,
        interestDate: result.paymentDate, // Date when interest was calculated and paid
        interestPaidTillDate: result.interestPaidTillDate,
        remainingAmount: result.remainingAmount,
        remainingInterest: result.remainingInterest,
        nextInterestStartDate: result.nextInterestStartDate,
        summary: {
          totalInterestCalculated: result.interest,
          amountPaid: totalAmountPaid,
          interestPortion: result.interestPaid,
          principalPortion: result.principalPaid,
        }
      };

      return sendSuccessResponse(res, responseData, "Payment applied successfully");
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

      const itemId = req.params.itemId;
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      // Fetch comprehensive payment and interest history
      const paymentHistory = await getPaymentHistory(itemId);

      // Structure the response to match makePayment response format
      const responseData = {
        itemId: paymentHistory.itemId,
        currentStatus: {
          originalAmount: paymentHistory.currentStatus.originalAmount,
          remainingAmount: paymentHistory.currentStatus.remainingAmount,
          totalPaid: paymentHistory.currentStatus.totalPaid,
          interestPaidTill: paymentHistory.currentStatus.interestPaidTill,
          monthlyInterestRate: paymentHistory.currentStatus.monthlyInterestRate,
        },
        summary: {
          totalAmountPaid: paymentHistory.totals.totalAmountPaid,
          totalInterestPaid: paymentHistory.totals.totalInterestPaid,
          totalPrincipalPaid: paymentHistory.totals.totalPrincipalPaid,
        },
        payments: paymentHistory.paymentHistory.map(payment => {
          const totalAmountPaid = payment.interestAmount + payment.principalAmount;
          return {
            paymentId: payment.paymentId,
            paymentDate: payment.paymentDate,
            paymentAmount: totalAmountPaid,
            interestAmount: payment.interestAmount,
            principalAmount: payment.principalAmount,
            interestDate: payment.paymentDate,
            summary: {
              amountPaid: totalAmountPaid,
              interestPortion: payment.interestAmount,
              principalPortion: payment.principalAmount,
            }
          };
        }),
      };

      return sendSuccessResponse(res, responseData, "Payment history fetched successfully");
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  async getCurrentInterestStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const itemId = req.params.itemId;
      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const interestStatus = await getCurrentInterestStatus(itemId);

      return sendSuccessResponse(res, interestStatus, "Current interest status fetched successfully");
    } catch (error: any) {
      console.error("Error fetching current interest status:", error);
      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }
}
