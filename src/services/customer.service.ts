import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "../utils/crypto.util.js";
const prisma = new PrismaClient();

export interface CustomerDataInput {
  customerId?: string;
  name: string;
  guardianName: string;
  relation: string;
  address: string;
  aadharNumber?: string;
  mobileNumber?: string;
  filePath?: string; // e.g., Aadhaar image path
}

export class CustomerService {
  async submitCustomer(userId: string, data: CustomerDataInput) {
    // Build payload but do NOT write placeholder values for optional unique fields.
    // Only include aadharNumber/mobileNumber if explicitly provided (to avoid unique-constraint conflicts).
    const baseData: any = {
      // If you want to encrypt later, replace these assignments with encrypt(...)
      name: data.name,
      guardianName: data.guardianName,
      address: data.address,
    };

    // 🔒 If customerId is provided, attempt to update
    if (data.customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          userId, // ✅ Ensure customer belongs to this user
        },
      });

      if (existingCustomer) {
        // Only include optional fields in update payload if they were provided in request
        const updatePayload: any = {
          ...baseData,
          relation: data.relation as any,
        };
        
        // Check for duplicate aadharNumber before updating
        if (typeof data.aadharNumber !== "undefined" && data.aadharNumber) {
          const duplicateAadhar = await prisma.customer.findFirst({
            where: {
              aadharNumber: data.aadharNumber,
              id: { not: data.customerId }, // Exclude current customer
            },
          });
          if (duplicateAadhar) {
            throw new Error("Aadhar number already exists for another customer");
          }
          updatePayload.aadharNumber = data.aadharNumber;
        }
        
        // Check for duplicate mobileNumber before updating
        if (typeof data.mobileNumber !== "undefined" && data.mobileNumber) {
          const duplicateMobile = await prisma.customer.findFirst({
            where: {
              mobileNumber: data.mobileNumber,
              id: { not: data.customerId }, // Exclude current customer
            },
          });
          if (duplicateMobile) {
            throw new Error("Mobile number already exists for another customer");
          }
          updatePayload.mobileNumber = data.mobileNumber;
        }

        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: updatePayload,
        });

        return {
          customerId: updatedCustomer.id,
        };
      }

      // ❗️If customerId is provided but not found, reject it
      throw new Error("Customer not found or does not belong to the user.");
    }

    // ➕ Create new customer if no customerId is provided
    // Check for duplicates before creating
    if (data.aadharNumber) {
      const duplicateAadhar = await prisma.customer.findFirst({
        where: { aadharNumber: data.aadharNumber },
      });
      if (duplicateAadhar) {
        throw new Error("Aadhar number already exists");
      }
    }
    
    if (data.mobileNumber) {
      const duplicateMobile = await prisma.customer.findFirst({
        where: { mobileNumber: data.mobileNumber },
      });
      if (duplicateMobile) {
        throw new Error("Mobile number already exists");
      }
    }

    const createPayload: any = {
      userId,
      ...baseData,
      relation: data.relation as any,
      // Use null for absent optional fields rather than a shared string placeholder
      aadharNumber: typeof data.aadharNumber !== "undefined" ? data.aadharNumber : null,
      mobileNumber: typeof data.mobileNumber !== "undefined" ? data.mobileNumber : null,
    };

    const newCustomer = await prisma.customer.create({
      data: createPayload,
    });

    return {
      message: "Customer created successfully",
      customerId: newCustomer.id,
    };
  }

  async getCustomers(
    userId: string,
    name?: string,
    guardianName?: string,
    address?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: "createdAt" | "updatedAt" = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const customers = await prisma.customer.findMany({
      where: { userId },
      orderBy: { [sortBy]: sortOrder },
    });

    const decrypted = customers.map((c) => ({
      id: c.id,
      // name: decrypt(c.name),
      // guardianName: decrypt(c.guardianName),
      // address: decrypt(c.address),
      name: c.name,
      guardianName: c.guardianName,
      address: c.address,
      relation: c.relation,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    const filtered = decrypted.filter((c) => {
      return (
        (!name || c.name.toLowerCase().includes(name.toLowerCase())) &&
        (!guardianName || c.guardianName.toLowerCase().includes(guardianName.toLowerCase())) &&
        (!address || c.address.toLowerCase().includes(address.toLowerCase()))
      );
    });

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      customers: paginated,
      page,
      limit,
      total: filtered.length,
    };
  }

  async getCustomerById(id: string, userId: string) {
    if (!id) {
      console.warn("Customer ID is missing");
      return null;
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      console.warn("Customer not found for ID:", id);
      return null;
    }

    // ✅ Extra security: ensure customer belongs to logged-in user
    if (customer.userId !== userId) {
      console.warn("Customer does not belong to this user");
      return null;
    }

    return {
      id: customer.id,
      // name: decrypt(customer.name),
      // guardianName: decrypt(customer.guardianName),
      // address: decrypt(customer.address),
      // mobileNumber: decrypt(customer.mobileNumber),
      // aadharNumber: decrypt(customer.aadharNumber),
      name: customer.name,
      guardianName: customer.guardianName,
      address: customer.address,
      mobileNumber: customer.mobileNumber,
      aadharNumber: customer.aadharNumber,
      relation: customer.relation,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async deleteCustomer(userId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, userId },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return { message: "Customer deleted successfully" };
  }
}
