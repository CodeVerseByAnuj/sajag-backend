import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "../utils/crypto.util";

const prisma = new PrismaClient();

export interface FormDataInput {
  name: string;
  guardianName: string;
  relation: string;
  address: string;
  itemWeight: string;
  fileName?: string;
  filePath?: string;
}

export class FormService {
  async submitForm(userId: string, formData: FormDataInput) {
    // Check if user already has form data
    const existingForm = await prisma.formData.findUnique({
      where: { userId },
    });

    // Encrypt sensitive data
    const encryptedData = {
      name: encrypt(formData.name),
      guardianName: encrypt(formData.guardianName),
      relation: encrypt(formData.relation),
      address: encrypt(formData.address),
      itemWeight: encrypt(formData.itemWeight),
      fileName: formData.fileName || null,
      filePath: formData.filePath || null,
    };

    if (existingForm) {
      // Update existing form
      const updatedForm = await prisma.formData.update({
        where: { userId },
        data: encryptedData,
      });

      return {
        message: "Form updated successfully",
        formId: updatedForm.id,
      };
    } else {
      // Create new form
      const newForm = await prisma.formData.create({
        data: {
          userId,
          ...encryptedData,
        },
      });

      return {
        message: "Form submitted successfully",
        formId: newForm.id,
      };
    }
  }

  async getFormData(userId: string) {
    const formData = await prisma.formData.findUnique({
      where: { userId },
    });

    if (!formData) {
      return null;
    }

    // Decrypt sensitive data
    const decryptedData = {
      id: formData.id,
      name: decrypt(formData.name),
      guardianName: decrypt(formData.guardianName),
      relation: decrypt(formData.relation),
      address: decrypt(formData.address),
      itemWeight: decrypt(formData.itemWeight),
      fileName: formData.fileName,
      filePath: formData.filePath,
      createdAt: formData.createdAt,
      updatedAt: formData.updatedAt,
    };

    return decryptedData;
  }

  async deleteForm(userId: string) {
    const formData = await prisma.formData.findUnique({
      where: { userId },
    });

    if (!formData) {
      throw new Error("Form data not found");
    }

    await prisma.formData.delete({
      where: { userId },
    });

    return { message: "Form data deleted successfully" };
  }
}
