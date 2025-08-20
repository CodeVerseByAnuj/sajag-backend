import { Item } from '@prisma/client'

export function calculateInterest(item: Item, fromDate: Date, toDate: Date): number {
  try {
    // Validate inputs
    if (!item || !fromDate || !toDate) {
      throw new Error("Invalid parameters for interest calculation");
    }
    
    // Calculate days between dates
    const msInDay = 1000 * 60 * 60 * 24;
    const days = Math.floor((toDate.getTime() - fromDate.getTime()) / msInDay);
    
    // Handle negative or zero days
    if (days <= 0) {
      return 0;
    }
    
    // Calculate daily interest rate (monthly rate / 30 days)
    const dailyRate = item.percentage / 30;
    
    // Calculate interest amount
    // Interest = Principal × Daily Rate × Number of Days / 100
    const interest = (item.remainingAmount * dailyRate * days) / 100;
    
    // Return rounded interest
    return Math.round(interest);
  } catch (error: any) {
    const msg = error?.message || "Failed to calculate interest.";
    throw new Error(msg);
  }
}
