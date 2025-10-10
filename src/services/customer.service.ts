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
    // ✅ Only encrypt sensitive fields, not enums
    const encryptedData = {
      // name: encrypt(data.name),
      // guardianName: encrypt(data.guardianName),
      // address: encrypt(data.address),
      // aadharNumber: encrypt(data.aadharNumber ?? ""),
      // mobileNumber: encrypt(data.mobileNumber ?? ""),
      name: data.name,
      guardianName: data.guardianName,
      address: data.address,
      aadharNumber: data.aadharNumber ?? "",
      mobileNumber: data.mobileNumber ?? "",
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
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            ...encryptedData,
            relation: data.relation as any,
          },
        });

        return {
          customerId: updatedCustomer.id,
        };
      }

      // ❗️If customerId is provided but not found, reject it
      throw new Error("Customer not found or does not belong to the user.");
    }

    // ➕ Create new customer if no customerId is provided
    const newCustomer = await prisma.customer.create({
      data: {
        userId,
        ...encryptedData,
        relation: data.relation as any,
      },
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
