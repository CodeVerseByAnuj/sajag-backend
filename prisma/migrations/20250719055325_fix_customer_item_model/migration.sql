/*
  Warnings:

  - You are about to drop the column `orderId` on the `items` table. All the data in the column will be lost.
  - Added the required column `customerId` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_orderId_fkey";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "orderId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
