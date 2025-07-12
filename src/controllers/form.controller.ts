import { Response } from "express";
import { z } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { FormService } from "../services/form.service";

const formService = new FormService();

const formDataSchema = z.object({
  name: z.string().min(1, "Name is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  relation: z.string().min(1, "Relation is required"),
  address: z.string().min(1, "Address is required"),
  itemWeight: z.string().min(1, "Item weight is required"),
});

export class FormController {
  async submitForm(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const formData = formDataSchema.parse(req.body);

      // Handle file upload if present
      let fileName: string | undefined;
      let filePath: string | undefined;

      if (req.file) {
        fileName = req.file.originalname;
        filePath = req.file.path;
      }

      const result = await formService.submitForm(userId, {
        ...formData,
        fileName,
        filePath,
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
        error: error.message || "Form submission failed",
      });
    }
  }

  async getForm(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const formData = await formService.getFormData(userId);

      if (!formData) {
        return res.json({
          hasData: false,
          data: null,
        });
      }

      res.json({
        hasData: true,
        data: {
          name: formData.name,
          guardianName: formData.guardianName,
          relation: formData.relation,
          address: formData.address,
          itemWeight: formData.itemWeight,
          fileName: formData.fileName,
          createdAt: formData.createdAt,
          updatedAt: formData.updatedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to fetch form data",
      });
    }
  }

  async deleteForm(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const result = await formService.deleteForm(userId);

      res.json(result);
    } catch (error: any) {
      res.status(400).json({
        error: error.message || "Failed to delete form data",
      });
    }
  }
}
