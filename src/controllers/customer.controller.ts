import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CustomerService } from "../services/customer.service";

const customerService = new CustomerService();

const customerDataSchema = z.object({
  customerId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  relation: z.enum(["father", "mother", "wife", "husband", "son", "daughter", "other"]),
  address: z.string().min(1, "Address is required"),
  aadharNumber: z.string().length(12, "Aadhar number must be 12 digits"),
  mobileNumber: z.string().length(10, "Mobile number must be 10 digits"),
});

export class CustomerController {
  async submitCustomer(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const customerData = customerDataSchema.parse(req.body);

      const result = await customerService.submitCustomer(userId, {
        ...customerData,
      });

      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        error: error.message || "Customer submission failed",
      });
    }
  }

  async getCustomer(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, guardianName, address, page, limit, sortBy, sortOrder } = req.query;

      const result = await customerService.getCustomers(
        req.user!.id,
        name as string,
        guardianName as string,
        address as string,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 10,
        (sortBy as "createdAt" | "updatedAt") || "createdAt",
        (sortOrder as "asc" | "desc") || "desc"
      );

      if (!result) {
        return res.json({ hasData: false, data: null });
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to fetch customer data",
      });
    }
  }

  async deleteCustomer(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const customerId = req.params.customerId;
      const result = await customerService.deleteCustomer(userId, customerId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || "Failed to delete customer",
      });
    }
  }
}
