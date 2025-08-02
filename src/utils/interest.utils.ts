import { Item } from '@prisma/client'

export function calculateInterest(item: Item, fromDate: Date, toDate: Date): number {
  const days = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyRate = item.percentage / 30
  return (item.remainingAmount * dailyRate * days) / 100
}
