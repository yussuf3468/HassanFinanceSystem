import { useEffect, useState, useMemo } from "react";
import { Banknote, TrendingUp, Package, Receipt } from "lucide-react";
import {
  useProducts,
  useRecentSales,
  useSalesTotals,
} from "../hooks/useSupabaseQuery";
import type { Product, Sale } from "../types";
import { formatDate } from "../utils/dateFormatter";
import OptimizedImage from "./OptimizedImage";

interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  lowStockCount: number;
  totalProducts: number;
  dailySales: number;
  dailyProfit: number;
  yearSales: number;
  yearProfit: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(value);
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalProfit: 0,
    lowStockCount: 0,
    totalProducts: 0,
    dailySales: 0,
    dailyProfit: 0,
    yearSales: 0,
    yearProfit: 0,
  });
  const [topProducts, setTopProducts] = useState<
    Array<{ product: Product; total: number }>
  >([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // ✅ Use accurate totals from database aggregation + recent sales for list/top products
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: sales = [], isLoading: salesLoading } = useRecentSales(500); // Last 500 for top products
  const { data: salesTotals, isLoading: totalsLoading } = useSalesTotals(); // Accurate totals

  const loading = productsLoading || salesLoading || totalsLoading;

  // Memoize expensive calculations
  const dashboardData = useMemo(() => {
    if (products.length === 0 || sales.length === 0 || !salesTotals)
      return null;
    return calculateDashboardData(sales, products, salesTotals);
  }, [products, sales, salesTotals]);

  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData.stats);
      setTopProducts(dashboardData.topProducts);
      setRecentSales(dashboardData.recentSales);
    }
  }, [dashboardData]);

  function calculateDashboardData(
    sales: Sale[],
    products: Product[],
    salesTotals: {
      total_sales: number;
      total_profit: number;
      today_sales: number;
      today_profit: number;
      year_sales: number;
      year_profit: number;
    }
  ) {
    try {
      // Use all-time totals from database (not fiscal year)
      const totalSales = salesTotals.total_sales; // All-time total sales
      const totalProfit = salesTotals.total_profit; // All-time total profit
      const dailySales = salesTotals.today_sales;
      const dailyProfit = salesTotals.today_profit;

      const lowStockCount = products.filter(
        (p) => p.quantity_in_stock <= p.reorder_level
      ).length;

      const stats = {
        totalSales,
        totalProfit,
        lowStockCount,
        totalProducts: products.length,
        dailySales,
        dailyProfit,
        yearSales: salesTotals.year_sales,
        yearProfit: salesTotals.year_profit,
      };

      // Use Map for O(1) lookups instead of Array.find
      const productMap = new Map(products.map((p) => [p.id, p]));
      const productSales = new Map<string, number>();

      sales.forEach((sale) => {
        const current = productSales.get(sale.product_id) || 0;
        productSales.set(sale.product_id, current + (sale.total_sale || 0));
      });

      const topProducts = Array.from(productSales.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, total]) => ({
          product: productMap.get(productId)!,
          total,
        }))
        .filter((item) => item.product);

      const recentSales = sales.slice(0, 5); // Already sorted by date DESC

      return { stats, topProducts, recentSales };
    } catch (error) {
      console.error("Error calculating dashboard:", error);
      // Return empty state on error
      return {
        stats: {
          totalSales: 0,
          totalProfit: 0,
          lowStockCount: 0,
          totalProducts: 0,
          dailySales: 0,
          dailyProfit: 0,
          yearSales: 0,
          yearProfit: 0,
        },
        topProducts: [],
        recentSales: [],
      };
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-900 dark:text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      {/* Hero Section - Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-900 backdrop-blur-2xl border border-amber-300/70 dark:border-slate-700 shadow-sm rounded-3xl p-4 md:p-6 shadow-2xl shadow-amber-500/10 dark:shadow-slate-900/50 transition-colors duration-200">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-stone-100/20 dark:from-slate-700/20 dark:to-slate-900/20"></div>
        <div className="relative">
          <div className="text-center space-y-2">
            <div className="inline-block">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-amber-600 dark:from-white dark:to-amber-500">
                HASSAN BOOKSHOP
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium max-w-3xl mx-auto">
              ✨ Ku soo dhowow Dashboard-ka HASSAN BOOKSHOP — Halka aad ku
              maamusho alaabta, iibka, iyo shaqaalaha. La soco xogta
              waqtiga-dhabta ah si aad ganacsigaaga hore ugu waddo!
            </p>

            <div className="flex items-center justify-center space-x-2 text-emerald-400 dark:text-emerald-500">
              <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">Live System Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium with High Contrast */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-full"></div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            Business Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.1s" }}
          >
            <StatCard
              title="Iibka Guud - Total Sales"
              value={formatCurrency(stats.totalSales)}
              icon={Banknote}
              color="blue"
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.2s" }}
          >
            <StatCard
              title="Faa'iidada - Total Profit"
              value={formatCurrency(stats.totalProfit)}
              icon={TrendingUp}
              color="green"
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.4s" }}
          >
            <StatCard
              title="Iibka Maanta - Today's Sales"
              value={formatCurrency(stats.dailySales)}
              icon={TrendingUp}
              color="orange"
              subtitle={`Profit: ${formatCurrency(stats.dailyProfit)}`}
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.3s" }}
          >
            <StatCard
              title="Alaabta Guud - Total Products"
              value={stats.totalProducts.toString()}
              icon={Package}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Content Grid - Ultra Premium Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Products Card - Golden Premium */}
        <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 backdrop-blur-xl border-2 border-amber-200/60 dark:border-slate-700 shadow-sm rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-500/10 dark:shadow-slate-900/50 hover:shadow-2xl hover:shadow-amber-400/20 dark:hover:shadow-amber-500/10 hover:border-amber-300/70 dark:hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          {/* Premium shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-2xl shadow-amber-400/30 shadow-xl shadow-amber-400/30 dark:shadow-amber-600/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              🏆 Top Products
            </h3>
          </div>
          <div className="relative space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center border-2 border-amber-300/70 dark:border-slate-600 shadow-amber-100/50 shadow-lg">
                  <Package className="w-6 h-6 text-amber-700 dark:text-amber-500" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  No sales data yet
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Start making sales to see analytics here
                </p>
              </div>
            ) : (
              topProducts.map((item, index) => (
                <div
                  key={item.product.id}
                  className="group/item bg-gradient-to-br from-amber-50/40 to-white dark:from-slate-700/40 dark:to-slate-800/60 hover:from-amber-100/50 hover:to-amber-50/30 dark:hover:from-slate-600/50 dark:hover:to-slate-700/70 backdrop-blur-sm border border-amber-200/60 dark:border-slate-600 shadow-sm hover:border-amber-300/70 dark:hover:border-slate-500 hover:shadow-md hover:shadow-amber-200/30 dark:hover:shadow-slate-900/30 rounded-2xl p-3 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform group-hover/item:scale-110 ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-orange-600 shadow-yellow-400/50"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-400/50"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-400/50"
                          : "bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-400/50"
                      }`}
                    >
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : index + 1}
                    </div>
                    {item.product.image_url && (
                      <OptimizedImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-xl border-2 border-amber-200/60 shadow-sm shadow-md group-hover/item:border-amber-300/70"
                        preset="thumbnail"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover/item:text-amber-900 dark:group-hover/item:text-amber-400 transition-colors">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold font-medium">
                        {item.product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 dark:text-white text-sm md:text-base">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales Card - Emerald Premium */}
        <div className="group relative bg-gradient-to-br from-white via-emerald-50/20 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 backdrop-blur-xl border-2 border-emerald-200/60 dark:border-slate-700 shadow-sm rounded-3xl p-6 md:p-8 shadow-2xl shadow-emerald-500/10 dark:shadow-slate-900/50 hover:shadow-2xl hover:shadow-emerald-400/20 dark:hover:shadow-emerald-500/10 hover:border-emerald-300/70 dark:hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
          {/* Premium shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 dark:via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 rounded-2xl shadow-xl shadow-emerald-400/30 dark:shadow-emerald-600/30">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
              📊 Recent Sales
            </h3>
          </div>
          <div className="relative space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center border-2 border-emerald-300/70 dark:border-slate-600 shadow-emerald-100/50 shadow-lg">
                  <Receipt className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  No sales recorded yet
                </p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="group/sale bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-slate-700/50 dark:to-slate-800/60 hover:from-emerald-100/60 hover:to-teal-50/50 dark:hover:from-slate-600/60 dark:hover:to-slate-700/70 backdrop-blur-sm border border-emerald-200/60 dark:border-slate-600 shadow-sm hover:border-emerald-300/70 dark:hover:border-slate-500 hover:shadow-md hover:shadow-emerald-200/30 dark:hover:shadow-slate-900/30 rounded-2xl p-3 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-xs md:text-sm group-hover/sale:text-emerald-900 dark:group-hover/sale:text-emerald-400 transition-colors">
                        {formatDate(sale.created_at)}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-400 font-semibold font-medium truncate">
                        {sale.sold_by}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-black text-slate-900 dark:text-white text-sm md:text-base">
                        {formatCurrency(sale.total_sale)}
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold font-bold">
                        +{formatCurrency(sale.profit)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange" | "red";
  subtitle?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: StatCardProps) {
  const colorClasses = {
    blue: {
      gradient: "from-amber-500 to-amber-600",
      glow: "shadow-amber-300",
      text: "text-blue-400",
    },
    green: {
      gradient: "from-green-600 to-emerald-600",
      glow: "shadow-emerald-500/50",
      text: "text-emerald-400",
    },
    purple: {
      gradient: "from-amber-500 to-rose-500",
      glow: "shadow-amber-300",
      text: "text-amber-700 ",
    },
    orange: {
      gradient: "from-orange-600 to-amber-600",
      glow: "shadow-orange-500/50",
      text: "text-orange-400",
    },
    red: {
      gradient: "from-red-600 to-rose-600",
      glow: "shadow-rose-500/50",
      text: "text-rose-400",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-900 backdrop-blur-xl border-2 border-amber-200/60 dark:border-slate-700 shadow-sm rounded-2xl p-4 md:p-5 shadow-2xl shadow-amber-500/10 dark:shadow-slate-900/50 hover:shadow-2xl hover:shadow-amber-400/20 dark:hover:shadow-slate-800/50 hover:border-amber-300/70 dark:hover:border-slate-600 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer will-change-transform overflow-hidden">
      {/* Premium gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-15 dark:group-hover:opacity-25 transition-opacity duration-500 rounded-2xl`}
      ></div>
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${colors.text}`}
          >
            {title}
          </p>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight whitespace-nowrap">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium whitespace-nowrap">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div
            className={`bg-gradient-to-br ${colors.gradient} p-2 md:p-2.5 rounded-2xl shadow-2xl ${colors.glow} group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
