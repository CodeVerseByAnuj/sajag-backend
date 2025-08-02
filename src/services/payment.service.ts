import { PrismaClient } from '@prisma/client'
import { calculateInterest } from '../utils/interest.utils'

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

export async function applyPayment(itemId: string, amountPaid: number) {
  const item = await prisma.item.findUnique({ where: { id: itemId } })
  if (!item) throw new Error('Item not found')

  const today = new Date()
  const fromDate = item.interestPaidTill || item.createdAt
  const totalInterest = calculateInterest(item, fromDate, today)

  let interestPaid = 0
  let principalPaid = 0
  let remainingInterest = 0

  if (amountPaid >= totalInterest) {
    // Full interest payment + principal
    interestPaid = totalInterest
    principalPaid = amountPaid - totalInterest
    remainingInterest = 0
  } else {
    // Partial interest payment only
    interestPaid = amountPaid
    principalPaid = 0
    remainingInterest = totalInterest - amountPaid
  }

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      interestPaidTill: amountPaid >= totalInterest ? today : item.interestPaidTill,
      totalPaid: { increment: amountPaid },
      remainingAmount: { decrement: principalPaid },
    }
  })

  await prisma.payment.create({
    data: {
      itemId,
      amountPaid,
      interestPaid,
      principalPaid,
    }
  })

  await prisma.interestHistory.create({
    data: {
      itemId,
      fromDate,
      toDate: today,
      interest: totalInterest,
    }
  })

  const nextInterestStartDate = amountPaid >= totalInterest ? today : null

  return { 
    interest: totalInterest,
    interestPaid, 
    principalPaid,
    remainingAmount: updatedItem.remainingAmount,
    remainingInterest,
    nextInterestStartDate
  }
}

// services/payment.service.ts
export  async function getPaymentHistory(itemId: string) {
    // 1. Get payment list
    const payments = await prisma.payment.findMany({
      where: { itemId },
      orderBy: { paidAt: "asc" },
    });

    // 2. Get aggregated totals
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
      totals: {
        totalAmountPaid: totals._sum.amountPaid || 0,
        totalInterestPaid: totals._sum.interestPaid || 0,
        totalPrincipalPaid: totals._sum.principalPaid || 0,
      },
      history: payments,
    };
  }

