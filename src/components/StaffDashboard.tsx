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
    if (email.includes("galiyowabi") || email.includes("admin"))
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
      (s) => new Date(s.created_at) >= todayStart
    );
    const weekSales = mySales.filter(
      (s) => new Date(s.created_at) >= weekStart
    );
    const monthSales = mySales.filter(
      (s) => new Date(s.created_at) >= monthStart
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
      .filter((s) => new Date(s.created_at) >= todayStart)
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
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
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/30 to-white backdrop-blur-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-3xl p-4 md:p-6 shadow-2xl shadow-amber-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10"></div>
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl shadow-lg shadow-amber-300/10">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-cyan-200">
                    Welcome, {staffName}! 👋
                  </h1>
                  <p className="text-xs md:text-sm text-slate-700 font-medium">
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
          <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center space-x-2">
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
        <div className="bg-gradient-to-br from-white via-amber-50/30 to-white backdrop-blur-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-3xl p-6 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-amber-400/30 shadow-xl shadow-amber-400/10">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              📅 This Week
            </h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-white to-stone-50/50 backdrop-blur-xl rounded-2xl p-4 border border-amber-100/50">
              <p className="text-xs text-slate-700 mb-1">Total Sales</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(metrics.thisWeekSales)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-stone-50/50 backdrop-blur-xl rounded-2xl p-4 border border-amber-100/50">
              <p className="text-xs text-slate-700 mb-1">Total Profit</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(metrics.thisWeekProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* This Month Card */}
        <div className="bg-gradient-to-br from-white via-amber-50/30 to-white backdrop-blur-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-3xl p-6 shadow-2xl hover:shadow-2xl hover:shadow-amber-400/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-rose-500 rounded-2xl shadow-xl shadow-amber-400/10">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white">
              📊 This Month
            </h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-white to-stone-50/50 backdrop-blur-xl rounded-2xl p-4 border border-amber-100/50">
              <p className="text-xs text-slate-700 mb-1">Total Sales</p>
              <p className="text-2xl font-black text-white">
                {formatCurrency(metrics.thisMonthSales)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-white to-stone-50/50 backdrop-blur-xl rounded-2xl p-4 border border-amber-100/50">
              <p className="text-xs text-slate-700 mb-1">Total Profit</p>
              <p className="text-2xl font-black text-emerald-400">
                {formatCurrency(metrics.thisMonthProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Sales List */}
      <div className="bg-gradient-to-br from-white via-amber-50/30 to-white backdrop-blur-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-3xl p-6 shadow-2xl shadow-amber-500/10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-amber-400/10">
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
            <div className="w-16 h-16 mx-auto mb-4 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center border border-amber-300/70 shadow-amber-100/50/60 shadow-sm">
              <ShoppingBag className="w-8 h-8 text-slate-700 " />
            </div>
            <p className="text-slate-900 font-bold mb-2">No sales yet today</p>
            <p className="text-slate-700 text-sm">
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
                  className="bg-gradient-to-br from-white to-stone-50/50 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/30 backdrop-blur-xl border border-amber-100/50 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    {product?.image_url ? (
                      <OptimizedImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm flex-shrink-0"
                        preset="thumbnail"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/20 rounded-xl flex items-center justify-center border border-amber-300/70 shadow-amber-100/50/60 shadow-sm flex-shrink-0">
                        <ShoppingBag className="w-8 h-8 text-slate-700 " />
                      </div>
                    )}

                    {/* Sale Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm md:text-base truncate">
                            {product?.name || "Unknown Product"}
                          </p>
                          <p className="text-xs text-slate-700 ">
                            {new Date(sale.created_at).toLocaleTimeString()} •
                            Qty: {sale.quantity_sold}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-slate-900 text-sm md:text-base">
                            {formatCurrency(sale.total_sale)}
                          </p>
                          <p className="text-xs text-emerald-400 font-bold">
                            +{formatCurrency(sale.profit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-br from-amber-50/40 to-white text-amber-800 font-semibold border border-amber-300">
                          {sale.payment_method}
                        </span>
                        {product?.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700 border border-rose-300">
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
      gradient: "from-amber-500 to-amber-600",
      glow: "shadow-amber-300",
      text: "text-amber-700 ",
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
  };

  const colors = colorClasses[color];

  return (
    <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-white backdrop-blur-2xl border border-amber-300/70 shadow-amber-100/50/60 shadow-sm rounded-2xl p-4 md:p-5 shadow-2xl hover:shadow-2xl hover:shadow-amber-400/20 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer will-change-transform overflow-hidden">
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
          <p className="text-base sm:text-lg md:text-xl font-black text-slate-900 leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-700 mt-0.5 font-medium">
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
