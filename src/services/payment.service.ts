import { PrismaClient } from '@prisma/client'
import { calculateInterest } from '../utils/interest.utils.js'
import { object } from 'zod';

const prisma = new PrismaClient();

export function calculateStandaloneInterest(amount: number, fromDate: Date, toDate: Date, monthlyRate: number): number {
  // Calculate interest based on monthly rate
  // Monthly rate converted to daily rate for precise calculation
  // P = Principal amount, R = Monthly interest rate, Days = Actual days between dates
  const msInDay = 1000 * 60 * 60 * 24;
  const diffInDays = Math.floor((toDate.getTime() - fromDate.getTime()) / msInDay);

  // Convert monthly rate to daily rate (assuming 30 days per month)
  const dailyRate = monthlyRate / 30;

  // Interest = Principal × Daily Rate × Number of Days / 100
  const interest = (amount * dailyRate * diffInDays) / 100;

  return Math.round(interest);
}
export async function applyPayment(
  itemId: string,
  interestAmount: number,
  principalAmount: number,
  paymentDate: Date
) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Item not found");
  console.log(item, 'Item Details');
  const originalAmount = item.remainingAmount;
  if (originalAmount <= 0) {
    throw new Error("remainingAmount must be greater than zero");
  }
  console.log(originalAmount, 'Original Amount')
  const remainingAmount = originalAmount - principalAmount;
  console.log(remainingAmount, 'Remaining Amount')

  // Total paid
  const totalAmountPaid = interestAmount + principalAmount;
  if (totalAmountPaid <= 0) {
    throw new Error("Total amount paid must be greater than zero");
  }

  // Update item (sirf principal reduce hoga)
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      interestPaidTill: paymentDate,
      totalPaid: { increment: totalAmountPaid },
      remainingAmount: remainingAmount,
    },
  });

  // Create payment record with proper interest date tracking
  const paymentRecord = await prisma.payment.create({
    data: {
      itemId,
      amountPaid: totalAmountPaid,
      interestPaid: interestAmount,
      principalPaid: principalAmount,
      paidAt: paymentDate, // Store the exact payment date
    }
  })

  return {
    paymentDate,
    totalPaid: totalAmountPaid,
    interestPaid: interestAmount,
    principalPaid: principalAmount,
    remainingAmount: remainingAmount,
  };
}


// Get current interest status for an item
export async function getCurrentInterestStatus(itemId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      payments: {
        orderBy: { paidAt: 'desc' },
        take: 1, // Get the latest payment
      }
    }
  });

  if (!item) throw new Error('Item not found');

  const today = new Date();
  const fromDate = item.interestPaidTill || item.createdAt;
  const currentInterest = calculateInterest(item, fromDate, today);

  // Calculate days since last interest payment
  const msInDay = 1000 * 60 * 60 * 24;
  const daysSinceLastPayment = Math.floor((today.getTime() - fromDate.getTime()) / msInDay);

  return {
    itemId,
    currentStatus: {
      originalAmount: item.amount,
      remainingPrincipal: item.remainingAmount,
      totalPaid: item.totalPaid,
      monthlyInterestRate: item.percentage,
      interestPaidTill: item.interestPaidTill,
      daysSinceLastInterestPayment: daysSinceLastPayment,
    },
    currentInterest: {
      amount: currentInterest,
      fromDate,
      toDate: today,
      daysCalculated: daysSinceLastPayment,
    },
    lastPayment: item.payments[0] ? {
      paymentId: item.payments[0].id,
      paymentDate: item.payments[0].paidAt,
      amountPaid: item.payments[0].amountPaid,
      interestAmount: item.payments[0].interestPaid,
      principalAmount: item.payments[0].principalPaid,
    } : null,
  };
}

// services/payment.service.ts
export async function getPaymentHistory(itemId: string) {
  // 1. Get payment list with detailed information
  const payments = await prisma.payment.findMany({
    where: { itemId },
    orderBy: { paidAt: "asc" },
    select: {
      id: true,
      amountPaid: true,
      interestPaid: true,
      principalPaid: true,
      paidAt: true, // Payment date
    }
  });

  console.log("Payment history for item:", payments);

  // 2. Get interest history for this item
  // const interestHistory = await prisma.interestHistory.findMany({
  //   where: { itemId },
  //   orderBy: { fromDate: "asc" },
  //   select: {
  //     id: true,
  //     fromDate: true,
  //     toDate: true,
  //     interest: true,
  //     createdAt: true,
  //   }
  // });

  // 3. Get current item status
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: {
      interestPaidTill: true,
      totalPaid: true,
      remainingAmount: true,
      amount: true,
      percentage: true,
    }
  });

  // 4. Get aggregated totals
  const totals = await prisma.payment.aggregate({
    where: { itemId },
    _sum: {
      amountPaid: true,
      interestPaid: true,
      principalPaid: true,
    },
  });

  return {
    itemId,
    currentStatus: {
      originalAmount: item?.amount || 0,
      remainingAmount: item?.remainingAmount || 0,
      totalPaid: item?.totalPaid || 0,
      interestPaidTill: item?.interestPaidTill,
      monthlyInterestRate: item?.percentage || 0,
    },
    totals: {
      totalAmountPaid: totals._sum.amountPaid || 0,
      totalInterestPaid: totals._sum.interestPaid || 0,
      totalPrincipalPaid: totals._sum.principalPaid || 0,
    },
    paymentHistory: payments.map(payment => ({
      paymentId: payment.id,
      paymentDate: payment.paidAt,
      amountPaid: payment.amountPaid,
      interestAmount: payment.interestPaid,
      principalAmount: payment.principalPaid,
      interestDate: payment.paidAt, // Date when interest was paid
    })),
    // interestHistory: interestHistory.map(history => ({
    //   id: history.id,
    //   fromDate: history.fromDate,
    //   toDate: history.toDate,
    //   interestAmount: history.interest,
    //   calculatedOn: history.createdAt,
    // })),
  };
}

