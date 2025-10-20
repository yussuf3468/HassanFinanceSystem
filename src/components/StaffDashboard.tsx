import { useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Clock,
  Calendar,
  Target,
  Sparkles,
} from "lucide-react";
import { useSales, useProducts } from "../hooks/useSupabaseQuery";
import { useAuth } from "../contexts/AuthContext";
import OptimizedImage from "./OptimizedImage";
import type { Product } from "../types";

interface StaffMetrics {
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
  todayAvgSale: number;
  thisWeekSales: number;
  thisWeekProfit: number;
  thisMonthSales: number;
  thisMonthProfit: number;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const { data: allSales = [] } = useSales();
  const { data: products = [] } = useProducts();

  // Get staff name from email
  const staffName = useMemo(() => {
    if (!user?.email) return "Staff Member";
    const email = user.email;
    if (email.includes("yussuf") || email.includes("admin"))
      return "Yussuf Muse";
    if (email.includes("khaled")) return "Khaled";
    return email.split("@")[0];
  }, [user]);

  // Show ALL sales from the store (not filtered by individual staff member)
  const mySales = useMemo(() => {
    // Staff dashboard now shows complete store activity for the day
    return allSales;
  }, [allSales]);

  // Calculate metrics
  const metrics = useMemo((): StaffMetrics => {
    // Create fresh date objects to avoid mutation
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const weekStartCalc = new Date(now);
    weekStartCalc.setDate(weekStartCalc.getDate() - weekStartCalc.getDay());
    const weekStart = new Date(
      weekStartCalc.getFullYear(),
      weekStartCalc.getMonth(),
      weekStartCalc.getDate()
    );

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todaySales = mySales.filter(
      (s) => new Date(s.sale_date) >= todayStart
    );
    const weekSales = mySales.filter((s) => new Date(s.sale_date) >= weekStart);
    const monthSales = mySales.filter(
      (s) => new Date(s.sale_date) >= monthStart
    );

    return {
      todaySales: todaySales.reduce((sum, s) => sum + s.total_sale, 0),
      todayProfit: todaySales.reduce((sum, s) => sum + s.profit, 0),
      todayTransactions: todaySales.length,
      todayAvgSale:
        todaySales.length > 0
          ? todaySales.reduce((sum, s) => sum + s.total_sale, 0) /
            todaySales.length
          : 0,
      thisWeekSales: weekSales.reduce((sum, s) => sum + s.total_sale, 0),
      thisWeekProfit: weekSales.reduce((sum, s) => sum + s.profit, 0),
      thisMonthSales: monthSales.reduce((sum, s) => sum + s.total_sale, 0),
      thisMonthProfit: monthSales.reduce((sum, s) => sum + s.profit, 0),
    };
  }, [mySales]);

  // Get today's sales sorted newest-first
  const todaysSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return mySales
      .filter((s) => new Date(s.sale_date) >= todayStart)
      .sort((a, b) => {
        const timeA = new Date(a.sale_date).getTime();
        const timeB = new Date(b.sale_date).getTime();
        return timeB - timeA; // Newest first
      })
      .slice(0, 10); // Top 10 most recent
  }, [mySales]);

  // Get product details
  const getProduct = (productId: string): Product | undefined => {
    return products.find((p) => p.id === productId);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(value);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      {/* Hero Section - Staff Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 md:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-cyan-200">
                    Welcome, {staffName}! 👋
                  </h1>
                  <p className="text-xs md:text-sm text-slate-200 font-medium">
                    Store-Wide Sales Dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Performance - Primary Stats */}
      <div>
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-emerald-600 to-cyan-600 rounded-full"></div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Store Performance Today</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.1s" }}
          >
            <MetricCard
              title="Today's Sales"
              value={formatCurrency(metrics.todaySales)}
              icon={DollarSign}
              color="blue"
              subtitle={`${metrics.todayTransactions} total transactions`}
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.2s" }}
          >
            <MetricCard
              title="Today's Profit"
              value={formatCurrency(metrics.todayProfit)}
              icon={TrendingUp}
              color="green"
              subtitle={
                metrics.todaySales > 0
                  ? `${(
                      (metrics.todayProfit / metrics.todaySales) *
                      100
                    ).toFixed(1)}% margin`
                  : "0% margin"
              }
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.3s" }}
          >
            <MetricCard
              title="Transactions"
              value={metrics.todayTransactions.toString()}
              icon={ShoppingBag}
              color="purple"
              subtitle="total sales"
            />
          </div>
          <div
            className="group animate-slideInLeft"
            style={{ animationDelay: "0.4s" }}
          >
            <MetricCard
              title="Avg Sale Value"
              value={formatCurrency(metrics.todayAvgSale)}
              icon={Target}
              color="orange"
              subtitle="per transaction"
            />
          </div>
        </div>
      </div>

      {/* Period Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* This Week Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl shadow-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              📅 This Week
            </h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Total Sales</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(metrics.thisWeekSales)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Total Profit</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(metrics.thisWeekProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* This Month Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              📊 This Month
            </h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Total Sales</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(metrics.thisMonthSales)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <p className="text-xs text-slate-400 mb-1">Total Profit</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(metrics.thisMonthProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sales List */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-xl">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-base md:text-lg font-bold text-white">
            🛍️ Today's Sales
          </h3>
          <span className="ml-auto text-sm font-semibold text-emerald-400">
            {todaysSales.length} sale{todaysSales.length !== 1 ? "s" : ""}
          </span>
        </div>

        {todaysSales.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-white font-bold mb-2">No sales yet today</p>
            <p className="text-slate-400 text-sm">
              Start making sales to see them here!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500 scrollbar-track-white/10">
            {todaysSales.map((sale) => {
              const product = getProduct(sale.product_id);
              return (
                <div
                  key={sale.id}
                  className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 rounded-xl p-4 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    {product?.image_url ? (
                      <OptimizedImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-white/20 flex-shrink-0"
                        preset="thumbnail"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/20 rounded-lg flex items-center justify-center border border-white/20 flex-shrink-0">
                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                      </div>
                    )}

                    {/* Sale Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm md:text-base truncate">
                            {product?.name || "Unknown Product"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(sale.sale_date).toLocaleTimeString()} •
                            Qty: {sale.quantity_sold}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-white text-sm md:text-base">
                            {formatCurrency(sale.total_sale)}
                          </p>
                          <p className="text-xs text-emerald-400 font-bold">
                            +{formatCurrency(sale.profit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {sale.payment_method}
                        </span>
                        {product?.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {product.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange";
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: MetricCardProps) {
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
  };

  const colors = colorClasses[color];

  return (
    <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 md:p-5 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer will-change-transform overflow-hidden">
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
          <p className="text-base sm:text-lg md:text-xl font-black text-white leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
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
