import { useEffect, useState } from "react";
import {
  Banknote,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
} from "lucide-react";
import { useProducts, useSales } from "../hooks/useSupabaseQuery";
import type { Product, Sale } from "../types";
import { formatDate } from "../utils/dateFormatter";
import OptimizedImage from "./OptimizedImage";

interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  lowStockCount: number;
  totalProducts: number;
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
  });
  const [topProducts, setTopProducts] = useState<
    Array<{ product: Product; total: number }>
  >([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // ✅ Use cached queries (reduces egress costs by 90%)
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: sales = [], isLoading: salesLoading } = useSales();

  const loading = productsLoading || salesLoading;

  useEffect(() => {
    if (products.length > 0 && sales.length > 0) {
      calculateDashboardData(sales, products);
    }
  }, [products, sales]);

  function calculateDashboardData(sales: Sale[], products: Product[]) {
    try {
      const totalSales = sales.reduce((sum, sale) => sum + sale.total_sale, 0);
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const lowStockCount = products.filter(
        (p) => p.quantity_in_stock <= p.reorder_level
      ).length;

      setStats({
        totalSales,
        totalProfit,
        lowStockCount,
        totalProducts: products.length,
      });

      const productSales = new Map<string, number>();
      sales.forEach((sale) => {
        const current = productSales.get(sale.product_id) || 0;
        productSales.set(sale.product_id, current + sale.total_sale);
      });

      const top = Array.from(productSales.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, total]) => ({
          product: products.find((p) => p.id === productId)!,
          total,
        }))
        .filter((item) => item.product);

      setTopProducts(top);
      setRecentSales(sales.slice(-5).reverse());
    } catch (error) {
      console.error("Error calculating dashboard:", error);
      // Show empty state on error
      setStats({
        totalSales: 0,
        totalProfit: 0,
        lowStockCount: 0,
        totalProducts: 0,
      });
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-white">Loading dashboard...</div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      {/* Hero Section - Premium */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 md:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
        <div className="relative">
          <div className="text-center space-y-2">
            <div className="inline-block">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
                Hassan Muse BookShop
              </h1>
            </div>
            <p className="text-xs md:text-sm text-slate-200 font-medium max-w-3xl mx-auto">
              ✨ Premium ERP Dashboard • Real-Time Analytics
            </p>
            <div className="flex items-center justify-center space-x-2 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold">Live System Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Premium with High Contrast */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
          <h2 className="text-lg md:text-xl font-bold text-white">
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
            style={{ animationDelay: "0.3s" }}
          >
            <StatCard
              title="Alaabta Guud - Total Products"
              value={stats.totalProducts.toString()}
              icon={Package}
              color="purple"
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.4s" }}
          >
            <StatCard
              title="Alaab Yaraatay - Low Stock"
              value={stats.lowStockCount.toString()}
              icon={AlertTriangle}
              color="orange"
            />
          </div>
        </div>
      </div>

      {/* Content Grid - Premium Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Top Products Card */}
        <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              🏆 Top Products
            </h3>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-white">
                  No sales data yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Start making sales to see analytics here
                </p>
              </div>
            ) : (
              topProducts.map((item, index) => (
                <div
                  key={item.product.id}
                  className="group/item bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-500 to-orange-600"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-500 to-slate-700"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-600 to-orange-700"
                          : "bg-gradient-to-br from-blue-500 to-cyan-600"
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
                        className="w-10 h-10 object-cover rounded-lg border border-white/20"
                        preset="thumbnail"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate text-sm">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {item.product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white text-sm md:text-base">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales Card */}
        <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-xl">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              📊 Recent Sales
            </h3>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-white">
                  No sales recorded yet
                </p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-xl p-3 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs md:text-sm">
                        {formatDate(sale.sale_date)}
                      </p>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {sale.sold_by}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-black text-white text-sm md:text-base">
                        {formatCurrency(sale.total_sale)}
                      </p>
                      <p className="text-xs text-emerald-400 font-bold">
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
      gradient: "from-blue-600 to-cyan-600",
      glow: "shadow-blue-500/50",
      text: "text-blue-400",
    },
    green: {
      gradient: "from-green-600 to-emerald-600",
      glow: "shadow-emerald-500/50",
      text: "text-emerald-400",
    },
    purple: {
      gradient: "from-purple-600 to-pink-600",
      glow: "shadow-purple-500/50",
      text: "text-purple-400",
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
    <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer will-change-transform overflow-hidden">
      {/* Animated gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl`}
      ></div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p
            className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${colors.text}`}
          >
            {title}
          </p>
          <p className="text-base sm:text-lg font-black text-white leading-tight whitespace-nowrap">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium whitespace-nowrap">
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
