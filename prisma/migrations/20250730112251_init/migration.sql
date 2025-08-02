-- AlterTable
ALTER TABLE "items" ADD COLUMN     "interestPaidTill" TIMESTAMP(3),
ADD COLUMN     "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "interestPaid" DOUBLE PRECISION NOT NULL,
    "principalPaid" DOUBLE PRECISION NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_history" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "interest" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interest_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interest_history" ADD CONSTRAINT "interest_history_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
