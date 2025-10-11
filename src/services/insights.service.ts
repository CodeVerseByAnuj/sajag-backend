// ...existing code...
import { PrismaClient } from "@prisma/client";
import { decrypt } from "../utils/crypto.util.js";

const prisma = new PrismaClient();

export interface InsightsData {
  totalCustomers: number;
  totalAmount: number;
  totalInterest: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalItems: number;
  averageInterestRate: number;
}

export class InsightsService {
  /**
   * Get daily aggregates for amount and interest for the last `days` days.
   * Returns an object with labels (YYYY-MM-DD) and two datasets: totalPaid and interestPaid
   */
  async getDailyAggregates(userId: string, days = 30) {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

      const payments = await prisma.payment.findMany({
        where: {
          item: {
            customer: {
              userId: userId
            }
          },
          paidAt: {
            gte: start
          }
        },
        select: {
          amountPaid: true,
          interestPaid: true,
          paidAt: true
        }
      });

      // initialize days map with zero values to ensure all days present
      const labels: string[] = [];
      const totalsMap: Record<string, { totalPaid: number; interestPaid: number }> = {};

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const key = d.toISOString().substr(0, 10); // YYYY-MM-DD
        labels.push(key);
        totalsMap[key] = { totalPaid: 0, interestPaid: 0 };
      }

      payments.forEach(p => {
        const key = p.paidAt.toISOString().substr(0, 10);
        if (!totalsMap[key]) {
          totalsMap[key] = { totalPaid: 0, interestPaid: 0 };
          labels.push(key);
        }
        totalsMap[key].totalPaid += p.amountPaid || 0;
        totalsMap[key].interestPaid += p.interestPaid || 0;
      });

      const totalPaidData = labels.map(l => totalsMap[l]?.totalPaid || 0);
      const interestPaidData = labels.map(l => totalsMap[l]?.interestPaid || 0);

      return {
        labels,
        datasets: [
          { label: 'Total Paid', data: totalPaidData },
          { label: 'Interest Paid', data: interestPaidData }
        ]
      };
    } catch (error) {
      console.error('Error fetching daily aggregates:', error);
      throw new Error('Failed to fetch daily aggregates');
    }
  }
  async getInsights(userId: string): Promise<InsightsData> {
    try {
      // Get total customers for this user
      const totalCustomers = await prisma.customer.count({
        where: { userId }
      });

      // Get all items for this user with aggregated data
      const itemsAggregation = await prisma.item.aggregate({
        where: {
          customer: {
            userId: userId
          }
        },
        _sum: {
          amount: true,
          totalPaid: true,
          remainingAmount: true,
        },
        _avg: {
          percentage: true,
        },
        _count: {
          id: true,
        }
      });

      // Get total interest paid across all payments for this user's items
      const interestAggregation = await prisma.payment.aggregate({
        where: {
          item: {
            customer: {
              userId: userId
            }
          }
        },
        _sum: {
          interestPaid: true,
        }
      });

      return {
        totalCustomers,
        totalAmount: itemsAggregation._sum.amount || 0,
        totalInterest: interestAggregation._sum.interestPaid || 0,
        totalPaidAmount: itemsAggregation._sum.totalPaid || 0,
        totalRemainingAmount: itemsAggregation._sum.remainingAmount || 0,
        totalItems: itemsAggregation._count.id || 0,
        averageInterestRate: itemsAggregation._avg.percentage || 0,
      };
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw new Error("Failed to fetch insights data");
    }
  }

  async getDetailedInsights(userId: string) {
    try {
      const basicInsights = await this.getInsights(userId);

      // Get category-wise breakdown
      const categoryBreakdown = await prisma.item.groupBy({
        by: ['category'],
        where: {
          customer: {
            userId: userId
          }
        },
        _sum: {
          amount: true,
          totalPaid: true,
          remainingAmount: true,
        },
        _count: {
          id: true,
        },
        _avg: {
          percentage: true,
        }
      });

      // Get recent activity (last 10 payments)
      const recentPayments = await prisma.payment.findMany({
        where: {
          item: {
            customer: {
              userId: userId
            }
          }
        },
        include: {
          item: {
            include: {
              customer: true
            }
          }
        },
        orderBy: { paidAt: 'desc' },
        take: 10
      });

      // Monthly trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyPayments = await prisma.payment.findMany({
        where: {
          item: {
            customer: {
              userId: userId
            }
          },
          paidAt: {
            gte: sixMonthsAgo
          }
        },
        select: {
          amountPaid: true,
          interestPaid: true,
          principalPaid: true,
          paidAt: true
        },
        orderBy: { paidAt: 'asc' }
      });

      return {
        ...basicInsights,
        categoryBreakdown: categoryBreakdown.map(item => ({
          category: item.category,
          totalAmount: item._sum.amount || 0,
          totalPaid: item._sum.totalPaid || 0,
          remainingAmount: item._sum.remainingAmount || 0,
          itemCount: item._count.id || 0,
          averageInterestRate: item._avg.percentage || 0,
        })),
        recentActivity: recentPayments.map(payment => ({
          paymentId: payment.id,
          itemName: payment.item.name,
          customerName: decrypt(payment.item.customer.name),
          amountPaid: payment.amountPaid,
          interestPaid: payment.interestPaid,
          principalPaid: payment.principalPaid,
          paidAt: payment.paidAt,
        })),
        monthlyTrends: this.groupPaymentsByMonth(monthlyPayments),
      };
    } catch (error) {
      console.error("Error fetching detailed insights:", error);
      throw new Error("Failed to fetch detailed insights data");
    }
  }

  private groupPaymentsByMonth(payments: any[]) {
    const monthlyData: { [key: string]: { totalPaid: number; interestPaid: number; principalPaid: number; count: number } } = {};

    payments.forEach(payment => {
      const monthKey = payment.paidAt.toISOString().substr(0, 7); // YYYY-MM format

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalPaid: 0,
          interestPaid: 0,
          principalPaid: 0,
          count: 0
        };
      }

      monthlyData[monthKey].totalPaid += payment.amountPaid;
      monthlyData[monthKey].interestPaid += payment.interestPaid;
      monthlyData[monthKey].principalPaid += payment.principalPaid;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Get monthly aggregates for amount and interest for the last `months` months.
   * Returns an object with labels (YYYY-MM) and two datasets: totalPaid and interestPaid
   */
  async getMonthlyAggregates(userId: string, months = 12) {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const payments = await prisma.payment.findMany({
        where: {
          item: {
            customer: {
              userId: userId
            }
          },
          paidAt: {
            gte: start
          }
        },
        select: {
          amountPaid: true,
          interestPaid: true,
          paidAt: true
        }
      });

      // initialize months map with zero values to ensure all months present
      const labels: string[] = [];
      const totalsMap: Record<string, { totalPaid: number; interestPaid: number }> = {};

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().substr(0, 7); // YYYY-MM
        labels.push(key);
        totalsMap[key] = { totalPaid: 0, interestPaid: 0 };
      }

      payments.forEach(p => {
        const key = p.paidAt.toISOString().substr(0, 7);
        if (!totalsMap[key]) {
          totalsMap[key] = { totalPaid: 0, interestPaid: 0 };
          labels.push(key);
        }
        totalsMap[key].totalPaid += p.amountPaid || 0;
        totalsMap[key].interestPaid += p.interestPaid || 0;
      });

      const totalPaidData = labels.map(l => totalsMap[l]?.totalPaid || 0);
      const interestPaidData = labels.map(l => totalsMap[l]?.interestPaid || 0);

      return {
        labels,
        datasets: [
          { label: 'Total Paid', data: totalPaidData },
          { label: 'Interest Paid', data: interestPaidData }
        ]
      };
    } catch (error) {
      console.error('Error fetching monthly aggregates:', error);
      throw new Error('Failed to fetch monthly aggregates');
    }
  }
}