import { PrismaClient } from "@prisma/client";
import { encrypt, decrypt } from "../utils/crypto.util";

const prisma = new PrismaClient();

export interface ItemInput {
  itemId?: string;
  customerId: string; // ✅ Required to associate item to a customer
  name: string;
  itemWeight: string;
  category: "gold" | "silver";
  percentage: number;
  amount: number;
  imagePath?: string;
  description?: string;
  orderId?: string; // ✅ Add this line
}

export class ItemService {
  async createOrUpdateItem(userId: string, data: ItemInput) {
    // ✅ Verify customer belongs to the user
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        userId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found or unauthorized");
    }

    let orderId = data.orderId;

    // ✅ If no orderId provided, create a new order
    if (!orderId) {
      const newOrder = await prisma.order.create({
        data: {
          customerId: data.customerId,
          // add any other required fields here
        },
      });
      orderId = newOrder.id;
    }

    const encryptedData = {
      name: encrypt(data.name),
      itemWeight: data.itemWeight,
      category: data.category,
      percentage: data.percentage,
      amount: data.amount,
      imagePath: data.imagePath,
      description: data.description,
      customerId: data.customerId,
      orderId, // ✅ guaranteed to be defined now
    };

    if (data.itemId) {
      // ✅ Update flow
      const existingItem = await prisma.item.findFirst({
        where: {
          id: data.itemId,
        },
      });

      if (!existingItem) {
        throw new Error("Item not found or unauthorized");
      }

      const updated = await prisma.item.update({
        where: { id: data.itemId },
        data: encryptedData,
      });

      return {
        message: "Item updated successfully",
        itemId: updated.id,
      };
    }

    // ✅ Create flow
    const created = await prisma.item.create({
      data: encryptedData,
    });

    return {
      message: "Item created successfully",
      itemId: created.id,
      orderId, // ✅ return this if frontend needs it
    };
  }


  async getItems(
    userId: string,
    customerId: string,
    name?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: "createdAt" | "updatedAt" = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    // ✅ Validate customer access
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found or unauthorized");
    }

    const items = await prisma.item.findMany({
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    const decrypted = items.map((item) => ({
      id: item.id,
      name: decrypt(item.name),
      category: item.category,
      percentage: item.percentage,
      amount: item.amount,
      itemWeight: item.itemWeight,
      imagePath: item.imagePath,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const filtered = decrypted.filter((item) =>
      !name || item.name.toLowerCase().includes(name.toLowerCase())
    );

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      data: paginated,
      page,
      limit,
      total: filtered.length,
    };
  }

  async getItemById(userId: string, itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!item || item.order.customer.userId !== userId) {
      throw new Error("Item not found or unauthorized");
    }

    return {
      id: item.id,
      name: decrypt(item.name),
      category: item.category,
      percentage: item.percentage,
      amount: item.amount,
      itemWeight: item.itemWeight,
      imagePath: item.imagePath,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async deleteItem(userId: string, itemId: string) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!item || item.order.customer.userId !== userId) {
      throw new Error("Item not found or unauthorized");
    }

    await prisma.item.delete({ where: { id: itemId } });
  }

}
