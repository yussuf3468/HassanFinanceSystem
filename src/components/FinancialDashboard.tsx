import { useEffect, useState } from "react";
import {
  DollarSign,
  PiggyBank,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  Banknote,
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  Download,
  Sun,
  Users,
  Percent,
} from "lucide-react";
import {
  useSales,
  useExpenses,
  useDebts,
  useInitialInvestments,
} from "../hooks/useSupabaseQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/dateFormatter";

interface FinancialStats {
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  totalInvestment: number;
  totalDebt: number;
  monthlyExpenses: number;
  activeDebts: number;
  investmentCategories: number;
  netWorth: number;
  monthlyProfit: number;
  monthlyRevenue: number;
  dailyProfit: number;
  dailyRevenue: number;
  yesterdayProfit: number;
}

interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
}

interface InvestorDividend {
  id: string;
  investor_name: string;
  amount: number;
  date: string;
  category: string;
  ownership_percentage: number;
  months_since_investment: number;
  payout_cycles: number;
  dividend_per_cycle: number;
  total_dividends: number;
  next_payout_date: string;
}

export default function FinancialDashboard() {
  const [stats, setStats] = useState<FinancialStats>({
    totalSales: 0,
    totalProfit: 0,
    totalExpenses: 0,
    totalInvestment: 0,
    totalDebt: 0,
    monthlyExpenses: 0,
    activeDebts: 0,
    investmentCategories: 0,
    netWorth: 0,
    monthlyProfit: 0,
    monthlyRevenue: 0,
    dailyProfit: 0,
    dailyRevenue: 0,
    yesterdayProfit: 0,
  });
  // ...existing code...
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseByCategory[]>(
    []
  );
  const [investorDividends, setInvestorDividends] = useState<
    InvestorDividend[]
  >([]);
  const [loading, setLoading] = useState(true);

  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { data: debts = [] } = useDebts();
  const { data: investments = [] } = useInitialInvestments();
  // Cyber services profit (all entries are pure profit)
  const { data: cyberServices = [] } = useQuery({
    queryKey: ["cyber_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cyber_services" as any)
        .select("*");
      if (error) throw error;
      return data || [];
    },
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
  // Track total cyber profit separately (after cyberServices is initialized)
  const cyberProfit = cyberServices.reduce(
    (sum: number, service: any) => sum + (service.amount || 0),
    0
  );

  useEffect(() => {
    loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, expenses, debts, investments, cyberServices]);

  const generateFinancialReport = () => {
    const today = new Date();
    const reportData = {
      generatedAt: today.toISOString(),
      reportDate: formatDate(today),
      businessName: "Lenzro ERP",

      // Executive Summary
      executiveSummary: {
        netWorth: stats.netWorth,
        monthlyProfit: stats.monthlyProfit,
        dailyProfit: stats.dailyProfit,
        profitGrowth: stats.dailyProfit - stats.yesterdayProfit,
        profitGrowthPercentage:
          stats.yesterdayProfit > 0
            ? ((stats.dailyProfit - stats.yesterdayProfit) /
                stats.yesterdayProfit) *
              100
            : 0,
        financialHealthScore: calculateFinancialHealthScore(),
      },

      // Revenue Analysis
      revenueAnalysis: {
        totalRevenue: stats.totalSales,
        monthlyRevenue: stats.monthlyRevenue,
        dailyRevenue: stats.dailyRevenue,
        profitMargin:
          stats.totalSales > 0
            ? (stats.totalProfit / stats.totalSales) * 100
            : 0,
      },

      // Expense Analysis
      expenseAnalysis: {
        totalExpenses: stats.totalExpenses,
        monthlyExpenses: stats.monthlyExpenses,
        expenseBreakdown: expenseBreakdown,
        expenseToRevenueRatio:
          stats.monthlyRevenue > 0
            ? (stats.monthlyExpenses / stats.monthlyRevenue) * 100
            : 0,
      },

      // Investment Overview
      investmentOverview: {
        totalInvestment: stats.totalInvestment,
        investmentCategories: stats.investmentCategories,
        returnOnInvestment:
          stats.totalInvestment > 0
            ? (stats.totalProfit / stats.totalInvestment) * 100
            : 0,
      },

      // Debt Analysis
      debtAnalysis: {
        totalDebt: stats.totalDebt,
        activeDebts: stats.activeDebts,
        debtToAssetRatio:
          stats.totalInvestment + stats.totalSales > 0
            ? (stats.totalDebt / (stats.totalInvestment + stats.totalSales)) *
              100
            : 0,
      },

      // Insights & Recommendations
      insights: generateInsights(),
    };

    // Create and download CSV report
    const csvContent = generateCSVReport(reportData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Financial_Report_${today.toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateFinancialHealthScore = () => {
    let score = 50; // Base score

    // Positive factors
    if (stats.netWorth > 0) score += 20;
    if (stats.monthlyProfit > 0) score += 15;
    if (stats.dailyProfit > stats.yesterdayProfit) score += 10;
    if (stats.totalDebt === 0) score += 15;
    else if (stats.totalDebt < stats.totalInvestment * 0.3) score += 10;

    // Negative factors
    if (stats.netWorth < 0) score -= 30;
    if (stats.monthlyProfit < 0) score -= 20;
    if (stats.totalDebt > stats.totalInvestment) score -= 15;

    return Math.max(0, Math.min(100, score));
  };

  const generateInsights = () => {
    const insights = [];

    // Profitability insights
    if (stats.dailyProfit > stats.yesterdayProfit) {
      const growth =
        ((stats.dailyProfit - stats.yesterdayProfit) / stats.yesterdayProfit) *
        100;
      insights.push(
        `📈 Daily profit increased by ${growth.toFixed(
          1
        )}% compared to yesterday`
      );
    } else if (stats.dailyProfit < stats.yesterdayProfit) {
      const decline =
        ((stats.yesterdayProfit - stats.dailyProfit) / stats.yesterdayProfit) *
        100;
      insights.push(
        `📉 Daily profit decreased by ${decline.toFixed(
          1
        )}% compared to yesterday`
      );
    }

    // Cash flow insights
    if (stats.monthlyProfit > 0) {
      insights.push(
        `💰 Positive monthly cash flow of KES ${stats.monthlyProfit.toLocaleString()}`
      );
    } else {
      insights.push(
        `⚠️ Negative monthly cash flow of KES ${Math.abs(
          stats.monthlyProfit
        ).toLocaleString()}`
      );
    }

    // Expense insights
    const topExpenseCategory = expenseBreakdown[0];
    if (topExpenseCategory) {
      insights.push(
        `🏷️ Highest expense category: ${
          topExpenseCategory.category
        } (${topExpenseCategory.percentage.toFixed(1)}%)`
      );
    }

    // Debt insights
    if (stats.totalDebt > 0) {
      const debtToWorthRatio =
        Math.abs(stats.netWorth) > 0
          ? (stats.totalDebt / Math.abs(stats.netWorth)) * 100
          : 0;
      if (debtToWorthRatio > 50) {
        insights.push(
          `🚨 High debt-to-net-worth ratio: ${debtToWorthRatio.toFixed(1)}%`
        );
      }
    }

    // ROI insights
    const roi =
      stats.totalInvestment > 0
        ? (stats.totalProfit / stats.totalInvestment) * 100
        : 0;
    if (roi > 20) {
      insights.push(
        `🎯 Excellent ROI of ${roi.toFixed(1)}% on initial investment`
      );
    } else if (roi > 10) {
      insights.push(`👍 Good ROI of ${roi.toFixed(1)}% on initial investment`);
    } else if (roi > 0) {
      insights.push(
        `📊 Moderate ROI of ${roi.toFixed(1)}% on initial investment`
      );
    }

    return insights;
  };

  const generateCSVReport = (data: any) => {
    const lines = [
      `Lenzro ERP - Financial Report`,
      `Generated: ${data.reportDate}`,
      ``,
      `EXECUTIVE SUMMARY`,
      `Net Worth,KES ${data.executiveSummary.netWorth.toLocaleString()}`,
      `Monthly Profit,KES ${data.executiveSummary.monthlyProfit.toLocaleString()}`,
      `Daily Profit,KES ${data.executiveSummary.dailyProfit.toLocaleString()}`,
      `Profit Growth,${data.executiveSummary.profitGrowthPercentage.toFixed(
        2
      )}%`,
      `Financial Health Score,${data.executiveSummary.financialHealthScore}/100`,
      ``,
      `REVENUE ANALYSIS`,
      `Total Revenue,KES ${data.revenueAnalysis.totalRevenue.toLocaleString()}`,
      `Monthly Revenue,KES ${data.revenueAnalysis.monthlyRevenue.toLocaleString()}`,
      `Daily Revenue,KES ${data.revenueAnalysis.dailyRevenue.toLocaleString()}`,
      `Profit Margin,${data.revenueAnalysis.profitMargin.toFixed(2)}%`,
      ``,
      `EXPENSE BREAKDOWN`,
      ...data.expenseAnalysis.expenseBreakdown.map(
        (exp: any) =>
          `${
            exp.category
          },KES ${exp.amount.toLocaleString()},${exp.percentage.toFixed(1)}%`
      ),
      ``,
      `KEY INSIGHTS`,
      ...data.insights,
    ];

    return lines.join("\n");
  };

  async function loadFinancialData() {
    try {
      setLoading(true);

      // Use cached data from hooks (already fetched once and cached indefinitely)
      const salesData: any[] = Array.isArray(sales) ? sales : [];
      const expensesData: any[] = Array.isArray(expenses) ? expenses : [];
      const investmentsData: any[] = Array.isArray(investments)
        ? investments
        : [];
      const debtsData: any[] = Array.isArray(debts) ? debts : [];

      // Calculate business metrics
      const cyberProfit = cyberServices.reduce(
        (sum: number, service: any) => sum + (service.amount || 0),
        0
      );
      // Total sales: only product/service sales
      const totalSales = salesData.reduce(
        (sum, sale) => sum + (sale.total_sale || 0),
        0
      );
      // Total profit: product/service profit + cyber profit
      const totalProfit = salesData.reduce(
        (sum, sale) => sum + (sale.profit || 0),
        0
      ) + cyberProfit;

      // Calculate financial metrics
      const totalExpenses = expensesData.reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );
      const totalInvestment = investmentsData.reduce(
        (sum, investment) => sum + (investment.amount || 0),
        0
      );

      // === START UPDATED DEBT LOGIC ===
      // helper: try common debt fields or compute principal - paid
      const getDebtBalance = (debt: any): number => {
        const candidates = [
          debt?.current_balance,
          debt?.balance,
          debt?.outstanding_balance,
          debt?.outstanding,
          debt?.amount_due,
          debt?.amount,
          debt?.remaining_balance,
        ];
        for (const v of candidates) {
          if (v != null && v !== "" && !isNaN(Number(v))) return Number(v);
        }
        if (debt && typeof debt === "object") {
          const principal = debt.principal ?? debt.loan_amount ?? debt.amount;
          const paid = debt.paid_amount ?? debt.amount_paid ?? 0;
          if (principal != null && !isNaN(Number(principal))) {
            const p = Number(principal);
            const paidNum = !isNaN(Number(paid)) ? Number(paid) : 0;
            return Math.max(0, p - paidNum);
          }
        }
        return 0;
      };

      const isDebtActive = (debt: any): boolean => {
        const status = (debt?.status || "").toString().toLowerCase().trim();
        if (["active", "open", "ongoing", "unpaid", "pending"].includes(status))
          return true;
        if (["paid", "closed", "settled", "completed"].includes(status))
          return false;
        if (getDebtBalance(debt) > 0) return true;
        if (
          debt?.paid === false ||
          debt?.is_paid === false ||
          debt?.isSettled === false
        )
          return true;
        return false;
      };

      const totalDebt = debtsData.reduce(
        (sum, debt) => sum + getDebtBalance(debt),
        0
      );
      const activeDebts = debtsData.filter((d) => isDebtActive(d)).length;
      // === END UPDATED DEBT LOGIC ===

      // Calculate current month metrics
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const monthlyExpenses = expensesData
        .filter((expense: any) => {
          if (!expense.date) return false;
          const expenseDate = new Date(expense.date);
          return (
            expenseDate.getMonth() + 1 === currentMonth &&
            expenseDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      const monthlyRevenue = salesData
        .filter((sale: any) => {
          if (!sale.sale_date) return false;
          const saleDate = new Date(sale.sale_date);
          return (
            saleDate.getMonth() + 1 === currentMonth &&
            saleDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, sale) => sum + (sale.total_sale || 0), 0)
        + cyberServices
            .filter((service: any) => {
              const serviceDate = new Date(service.date);
              return (
                serviceDate.getMonth() + 1 === currentMonth &&
                serviceDate.getFullYear() === currentYear
              );
            })
            .reduce((sum: number, service: any) => sum + (service.amount || 0), 0);

      const monthlyProfit = salesData
        .filter((sale: any) => {
          if (!sale.sale_date) return false;
          const saleDate = new Date(sale.sale_date);
          return (
            saleDate.getMonth() + 1 === currentMonth &&
            saleDate.getFullYear() === currentYear
          );
        })
        .reduce((sum, sale) => sum + (sale.profit || 0), 0)
        + cyberServices
            .filter((service: any) => {
              const serviceDate = new Date(service.date);
              return (
                serviceDate.getMonth() + 1 === currentMonth &&
                serviceDate.getFullYear() === currentYear
              );
            })
            .reduce((sum: number, service: any) => sum + (service.amount || 0), 0);

      // Calculate daily metrics
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const dailyRevenue = salesData
        .filter((sale: any) => {
          if (!sale.sale_date) return false;
          const saleDate = new Date(sale.sale_date).toISOString().split("T")[0];
          return saleDate === todayStr;
        })
        .reduce((sum, sale) => sum + (sale.total_sale || 0), 0)
        + cyberServices
            .filter((service: any) => {
              const serviceDate = new Date(service.date).toISOString().split("T")[0];
              return serviceDate === todayStr;
            })
            .reduce((sum: number, service: any) => sum + (service.amount || 0), 0);

      const dailyProfit = salesData
        .filter((sale: any) => {
          if (!sale.sale_date) return false;
          const saleDate = new Date(sale.sale_date).toISOString().split("T")[0];
          return saleDate === todayStr;
        })
        .reduce((sum, sale) => sum + (sale.profit || 0), 0)
        + cyberServices
            .filter((service: any) => {
              const serviceDate = new Date(service.date).toISOString().split("T")[0];
              return serviceDate === todayStr;
            })
            .reduce((sum: number, service: any) => sum + (service.amount || 0), 0);

      const yesterdayProfit = salesData
        .filter((sale: any) => {
          if (!sale.sale_date) return false;
          const saleDate = new Date(sale.sale_date).toISOString().split("T")[0];
          return saleDate === yesterdayStr;
        })
        .reduce((sum, sale) => sum + (sale.profit || 0), 0);

      const investmentCategories = new Set(
        investmentsData.map((inv: any) => inv.category).filter(Boolean)
      ).size;

      // Calculate net worth (assets - liabilities)
      const netWorth = totalSales + totalInvestment - totalExpenses - totalDebt;

      setStats({
        totalSales,
        totalProfit,
        totalExpenses,
        totalInvestment,
        totalDebt,
        monthlyExpenses,
        activeDebts,
        investmentCategories,
        netWorth,
        monthlyProfit: monthlyProfit - monthlyExpenses, // Net monthly profit after expenses
        monthlyRevenue,
        dailyProfit,
        dailyRevenue,
        yesterdayProfit,
      });

      // Calculate expense breakdown by category
      const categoryTotals = expensesData.reduce((acc: any, expense: any) => {
        const category = expense.category || "Other";
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});

      const breakdown = Object.entries(categoryTotals)
        .map(([category, amount]: [string, any]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      setExpenseBreakdown(breakdown);

      // Calculate investor dividends
      calculateInvestorDividends(investmentsData, totalProfit, totalInvestment);
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateInvestorDividends(
    investments: any[],
    totalProfit: number,
    totalInvestmentAmount: number
  ) {
    const today = new Date();
    const dividendData: InvestorDividend[] = [];

    investments.forEach((investment) => {
      // Validate investment date - check both 'date' and 'invested_on' fields
      const dateValue = investment.date || investment.invested_on;
      if (!dateValue) {
        console.log("Skipping investment without date:", investment);
        return;
      }

      const investmentDate = new Date(dateValue);

      // Check if date is valid
      if (isNaN(investmentDate.getTime())) {
        console.log("Invalid investment date:", dateValue);
        return;
      }

      const monthsSinceInvestment = Math.floor(
        (today.getTime() - investmentDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      );

      // Calculate ownership percentage
      const ownershipPercentage =
        totalInvestmentAmount > 0
          ? (investment.amount / totalInvestmentAmount) * 100
          : 0;

      // Calculate payout cycles (every 6 months)
      const payoutCycles = Math.max(0, Math.floor(monthsSinceInvestment / 6));

      // Calculate dividend per cycle (based on ownership percentage of profit)
      const dividendPerCycle = (totalProfit * ownershipPercentage) / 100 / 2; // Divided by 2 for bi-annual payments

      // Calculate total dividends earned so far
      const totalDividends = dividendPerCycle * payoutCycles;

      // Calculate next payout date
      const nextPayoutDate = new Date(investmentDate.getTime());
      const monthsToAdd = (payoutCycles + 1) * 6;
      nextPayoutDate.setMonth(investmentDate.getMonth() + monthsToAdd);

      // Ensure next payout date is valid
      let nextPayoutDateStr = today.toISOString().split("T")[0]; // fallback to today
      if (!isNaN(nextPayoutDate.getTime())) {
        nextPayoutDateStr = nextPayoutDate.toISOString().split("T")[0];
      }

      dividendData.push({
        id: investment.id,
        investor_name:
          investment.investor_name ||
          investment.notes ||
          investment.description ||
          investment.source ||
          "Unknown Investor",
        amount: investment.amount,
        date: dateValue,
        category:
          investment.category || investment.source || "General Investment",
        ownership_percentage: ownershipPercentage,
        months_since_investment: monthsSinceInvestment,
        payout_cycles: payoutCycles,
        dividend_per_cycle: dividendPerCycle,
        total_dividends: totalDividends,
        next_payout_date: nextPayoutDateStr,
      });
    });

    setInvestorDividends(dividendData);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10"></div>
        <div className="relative">
          <div className="text-center space-y-3">
            <div className="inline-block">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-green-200">
                💰 Financial Dashboard
              </h1>
            </div>
            <p className="text-sm md:text-base text-slate-200 font-medium max-w-3xl mx-auto">
              ✨ Comprehensive financial overview and business metrics for your
              organization
            </p>
            {/* Export Button */}
            <button
              onClick={generateFinancialReport}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Profit Section */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          <span>Total Profit</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Full Store Total Sales (all time, all sources) */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">
                  Total Sales (All Sources)
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  KES {(
                    sales.reduce((sum: number, sale: any) => sum + (sale.total_sale || 0), 0) +
                    cyberServices.reduce((sum: number, service: any) => sum + (service.amount || 0), 0)
                  ).toLocaleString()}
                </p>
              </div>
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>

          {/* Full Store Total Profit (all time, all sources) */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">
                  Total Profit (All Sources)
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  KES {(
                    sales.reduce((sum: number, sale: any) => sum + (sale.profit || 0), 0) +
                    cyberServices.reduce((sum: number, service: any) => sum + (service.amount || 0), 0)
                  ).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>

          {/* Full Store Total Revenue (Cash at Hand, all time) */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium opacity-90">
                  Total Revenue (Cash at Hand)
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  KES {(
                    sales.reduce((sum: number, sale: any) => sum + (sale.total_sale || 0), 0) +
                    cyberServices.reduce((sum: number, service: any) => sum + (service.amount || 0), 0)
                  ).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-green-600 rounded-full"></div>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Key Financial Metrics
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <FinancialStatCard
            title="Net Worth"
            value={`KES ${stats.netWorth.toLocaleString()}`}
            icon={TrendingUp}
            color={stats.netWorth >= 0 ? "green" : "red"}
            subtitle="Assets minus liabilities"
          />
          <FinancialStatCard
            title="Monthly Profit"
            value={`KES ${stats.monthlyProfit.toLocaleString()}`}
            icon={stats.monthlyProfit >= 0 ? TrendingUp : TrendingDown}
            color={stats.monthlyProfit >= 0 ? "green" : "red"}
            subtitle="This month's net profit"
          />
          <FinancialStatCard
            title="Total Investment"
            value={`KES ${stats.totalInvestment.toLocaleString()}`}
            icon={PiggyBank}
            color="blue"
            subtitle="Initial capital invested"
          />
          <FinancialStatCard
            title="Outstanding Debt"
            value={`KES ${stats.totalDebt.toLocaleString()}`}
            icon={CreditCard}
            color="orange"
            subtitle={`${stats.activeDebts} active loans`}
          />
        </div>
      </div>

      {/* Revenue & Profit Overview */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/20">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
          <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          <span>Revenue & Profitability</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          {/* Cyber Profit Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-cyan-500/30">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-cyan-400">
                  Total Cyber Profits
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  KES {cyberProfit.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Pure profit from cyber café services
            </p>
          </div>

          {/* Total Sales Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-500/30">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="bg-green-500/20 p-2 rounded-lg border border-green-500/30">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-400">
                  Total Sales
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  KES {stats.totalSales.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Cumulative revenue to date
            </p>
          </div>

          {/* Total Profit Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-500/30">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-400">
                  Total Profit
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  KES {stats.totalProfit.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {stats.totalSales > 0
                ? ((stats.totalProfit / stats.totalSales) * 100).toFixed(1)
                : 0}
              % profit margin
            </p>
          </div>

          {/* Monthly Revenue Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-500/30">
            <div className="flex items-center space-x-3 mb-3 sm:mb-4">
              <div className="bg-purple-500/20 p-2 rounded-lg border border-purple-500/30">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-400">
                  Monthly Revenue
                </p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                  KES {stats.monthlyRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Current month sales
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
        {/* Expense Analysis */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/20">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span>Expense Analysis</span>
          </h3>

          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-slate-300">
                Total Expenses:
              </span>
              <span className="text-lg sm:text-xl font-bold text-red-600">
                KES {stats.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-slate-300">
                Monthly Expenses:
              </span>
              <span className="text-base sm:text-lg font-semibold text-orange-600">
                KES {stats.monthlyExpenses.toLocaleString()}
              </span>
            </div>
          </div>

          {expenseBreakdown.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-white mb-3">
                Top Expense Categories
              </h4>
              {expenseBreakdown.slice(0, 5).map((category) => (
                <div key={category.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {category.category}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-slate-300">
                        {category.percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        KES {category.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-8">
              No expense data available
            </p>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl border border-white/20">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center space-x-2">
            <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Financial Summary</span>
          </h3>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                <span className="text-sm sm:text-base font-semibold text-white">
                  Assets
                </span>
              </div>
              <div className="space-y-2 ml-6 sm:ml-8">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-slate-300">
                    Cash from Sales:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    KES {stats.totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-slate-300">
                    Initial Investment:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    KES {stats.totalInvestment.toLocaleString()}
                  </span>
                </div>
                <hr className="border-white/20" />
                <div className="flex justify-between font-semibold">
                  <span className="text-sm sm:text-base text-white">
                    Total Assets:
                  </span>
                  <span className="text-sm sm:text-base text-white">
                    KES{" "}
                    {(
                      stats.totalSales + stats.totalInvestment
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/10">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="text-sm sm:text-base font-semibold text-white">
                  Liabilities
                </span>
              </div>
              <div className="space-y-2 ml-6 sm:ml-8">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-slate-300">
                    Total Expenses:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    KES {stats.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-slate-300">
                    Outstanding Debt:
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white">
                    KES {stats.totalDebt.toLocaleString()}
                  </span>
                </div>
                <hr className="border-white/20" />
                <div className="flex justify-between font-semibold">
                  <span className="text-sm sm:text-base text-white">
                    Total Liabilities:
                  </span>
                  <span className="text-sm sm:text-base text-white">
                    KES{" "}
                    {(stats.totalExpenses + stats.totalDebt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-500/30">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-sm sm:text-base font-bold text-white">
                  Net Worth
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-black text-white ml-6 sm:ml-8">
                KES {stats.netWorth.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-slate-300 ml-6 sm:ml-8">
                {stats.netWorth >= 0 ? "Positive" : "Negative"} financial
                position
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          <span>Financial Insights</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Financial Health Score */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
              Health Score
            </h4>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {calculateFinancialHealthScore()}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Financial Health
                </p>
                <p className="text-sm sm:text-base font-semibold text-white">
                  {calculateFinancialHealthScore() >= 80
                    ? "Excellent"
                    : calculateFinancialHealthScore() >= 60
                    ? "Good"
                    : calculateFinancialHealthScore() >= 40
                    ? "Fair"
                    : "Poor"}
                </p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-2">
              Key Insights
            </h4>
            <div className="space-y-2">
              {generateInsights()
                .slice(0, 3)
                .map((insight, index) => (
                  <p
                    key={index}
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    {insight}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Investor Dividends Section */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <span>Investor Dividends</span>
          </h3>
          <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            <span className="text-xs sm:text-sm font-semibold text-emerald-300">
              {investorDividends.length} Investors
            </span>
          </div>
        </div>

        {investorDividends.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {investorDividends.map((investor) => (
              <div
                key={investor.id}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-4 sm:p-5 border border-white/20 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg"
              >
                {/* Investor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                      {investor.investor_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {investor.category}
                    </p>
                  </div>
                  <div className="bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center space-x-1">
                      <Percent className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300">
                        {investor.ownership_percentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Investment Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">
                      Initial Investment
                    </p>
                    <p className="text-sm sm:text-base font-bold text-white">
                      KES {investor.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-slate-400 mb-1">
                      Investment Date
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white">
                      {formatDate(investor.date)}
                    </p>
                  </div>
                </div>

                {/* Dividend Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-t border-white/10">
                    <span className="text-xs sm:text-sm text-slate-300">
                      Months Since Investment:
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {investor.months_since_investment} months
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-white/10">
                    <span className="text-xs sm:text-sm text-slate-300">
                      Payout Cycles Completed:
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {investor.payout_cycles} cycles
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-t border-white/10">
                    <span className="text-xs sm:text-sm text-slate-300">
                      Dividend Per Cycle:
                    </span>
                    <span className="text-sm font-semibold text-white">
                      KES{" "}
                      {investor.dividend_per_cycle.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg p-3 border border-emerald-500/30 mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-semibold text-emerald-300">
                        Total Dividends Earned:
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-400">
                        KES{" "}
                        {investor.total_dividends.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Next Payout Information - Always Show */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/30 mt-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-300">
                          Next Payout Date:
                        </span>
                        <span className="text-sm font-bold text-blue-400">
                          {formatDate(investor.next_payout_date)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-blue-500/20">
                        <span className="text-xs font-semibold text-purple-300">
                          Estimated Dividend:
                        </span>
                        <span className="text-sm font-bold text-purple-400">
                          KES{" "}
                          {investor.dividend_per_cycle.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {investor.months_since_investment < 6 && (
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30 mt-2">
                      <p className="text-xs text-yellow-300 text-center">
                        ⏳ First payout eligible in{" "}
                        {6 - investor.months_since_investment} months
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No investor data available</p>
            <p className="text-xs text-slate-500 mt-1">
              Add investors in the Initial Investment section
            </p>
          </div>
        )}

        {/* Summary Statistics */}
        {investorDividends.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold text-white">
                  Total Dividends Paid
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">
                KES{" "}
                {investorDividends
                  .reduce((sum, inv) => sum + inv.total_dividends, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-white">
                  Active Investors
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-blue-400">
                {investorDividends.length}
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-white">
                  Avg. Ownership
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-purple-400">
                {investorDividends.length > 0
                  ? (
                      investorDividends.reduce(
                        (sum, inv) => sum + inv.ownership_percentage,
                        0
                      ) / investorDividends.length
                    ).toFixed(2)
                  : 0}
                %
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center space-x-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span>Financial Management</span>
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 mb-4">
          Manage your business financial records and track performance
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/20 hover:border-green-400">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="bg-green-500/20 p-1.5 sm:p-2 rounded-lg border border-green-500/30">
                <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-white">
                  Investments
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  {stats.investmentCategories} categories
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Track startup investments</p>
          </div>

          <div className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/20 hover:border-blue-400">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-lg border border-blue-500/30">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-white">
                  Expenses
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  Monthly tracking
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Monitor operational costs</p>
          </div>

          <div className="bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-white/20 hover:border-red-400 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <div className="bg-red-500/20 p-1.5 sm:p-2 rounded-lg border border-red-500/30">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-white">
                  Debts
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  {stats.activeDebts} active loans
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Track loan repayments</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FinancialStatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange" | "red";
  subtitle?: string;
}

function FinancialStatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: FinancialStatCardProps) {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      border: "border-blue-500/30",
      text: "text-blue-400",
      iconBg: "bg-blue-500/20 border-blue-500/30",
      glow: "shadow-blue-500/25",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      border: "border-green-500/30",
      text: "text-green-400",
      iconBg: "bg-green-500/20 border-green-500/30",
      glow: "shadow-green-500/25",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      border: "border-purple-500/30",
      text: "text-purple-400",
      iconBg: "bg-purple-500/20 border-purple-500/30",
      glow: "shadow-purple-500/25",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      border: "border-orange-500/30",
      text: "text-orange-400",
      iconBg: "bg-orange-500/20 border-orange-500/30",
      glow: "shadow-orange-500/25",
    },
    red: {
      gradient: "from-red-500 to-red-600",
      border: "border-red-500/30",
      text: "text-red-400",
      iconBg: "bg-red-500/20 border-red-500/30",
      glow: "shadow-red-500/25",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border ${colors.border} p-3 sm:p-6 hover:shadow-xl hover:${colors.glow} transition-all duration-300 hover:scale-105 cursor-pointer`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p
            className={`text-xs font-bold ${colors.text} uppercase tracking-wide`}
          >
            {title}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-white mt-1.5 sm:mt-2 group-hover:scale-110 transition-transform duration-300">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-300 mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className="relative">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-lg sm:rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300`}
          ></div>
          <div
            className={`relative ${colors.iconBg} border p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
          >
            <Icon
              className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text} group-hover:animate-pulse`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
