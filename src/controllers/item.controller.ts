import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { ItemService } from "../services/item.service";

const itemService = new ItemService();

const itemDataSchema = z.object({
  itemId: z.string().optional(),
  customerId: z.string().min(1, "Name is required"),
  name: z.string().min(1, "Name is required"),
  category: z.enum(["gold", "silver"], {
    required_error: "Category is required",
  }),
  percentage: z.number().min(1, "Percentage must be greater than 0"),
  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number",
  }),
  imagePath: z.string().optional(), // optional string for image URL/path
  itemWeight: z.string({
    required_error: "Item weight is required",
  }),
  description: z.string().optional(), // optional string
});


export class ItemController {
  async createItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const itemData = itemDataSchema.parse(req.body);
    const item = await itemService.createOrUpdateItem(userId, { ...itemData });
      res.json(item);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }

      res.status(400).json({
        error: error.message || "item submission failed",
      });
    }
  }

async getItems(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User ID not found" });
    }

    const {
      customerId,
      name,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!customerId || typeof customerId !== "string") {
      return res.status(400).json({ error: "Missing or invalid customerId" });
    }

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const items = await itemService.getItems(
      userId,
      customerId,
      typeof name === "string" ? name : undefined,
      isNaN(pageNumber) ? 1 : pageNumber,
      isNaN(limitNumber) ? 10 : limitNumber,
      sortBy === "updatedAt" ? "updatedAt" : "createdAt",
      sortOrder === "asc" ? "asc" : "desc"
    );

    return res.status(200).json(items);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}


}
