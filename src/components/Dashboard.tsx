import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { DashboardStats, Product, Sale } from "../types";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Check if Supabase is properly configured
      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        console.warn("Supabase not configured - showing empty state");
        // Show empty state when Supabase is not configured
        setStats({
          totalSales: 0,
          totalProfit: 0,
          lowStockCount: 0,
          totalProducts: 0,
        });
        setLoading(false);
        return;
      }

      const [salesRes, productsRes] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("products").select("*"),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) throw productsRes.error;

      const sales = salesRes.data || [];
      const products = productsRes.data || [];

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
      console.error("Error loading dashboard:", error);
      // Show empty state on error
      setStats({
        totalSales: 0,
        totalProfit: 0,
        lowStockCount: 0,
        totalProducts: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tusmada Guud - Dashboard Overview
        </h1>
        <p className="text-slate-600 font-medium">
          Warbixin degdeg ah oo ku saabsan Hassan Muse BookShop
        </p>
      </div>

      {/* Stats Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-slideInLeft" style={{ animationDelay: "0.1s" }}>
          <StatCard
            title="Iibka Guud - Total Sales"
            value={`KES ${stats.totalSales.toLocaleString()}`}
            icon={DollarSign}
            color="blue"
          />
        </div>
        <div className="animate-slideInLeft" style={{ animationDelay: "0.2s" }}>
          <StatCard
            title="Faa'iidada - Total Profit"
            value={`KES ${stats.totalProfit.toLocaleString()}`}
            icon={TrendingUp}
            color="green"
          />
        </div>
        <div className="animate-slideInLeft" style={{ animationDelay: "0.3s" }}>
          <StatCard
            title="Alaabta Guud - Total Products"
            value={stats.totalProducts.toString()}
            icon={Package}
            color="purple"
          />
        </div>
        <div className="animate-slideInLeft" style={{ animationDelay: "0.4s" }}>
          <StatCard
            title="Alaab Yaraatay - Low Stock"
            value={stats.lowStockCount.toString()}
            icon={AlertTriangle}
            color="orange"
          />
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products Card */}
        <div className="group bg-gradient-to-br from-white to-slate-50 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              🏆 Alaabta Ugu Iibka Badan - Top Products
            </h3>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  Wali iib ma jirin - No sales data yet
                </p>
                <p className="text-slate-400 text-sm">
                  Bilow iibka si aad u aragto alaabta ugu iibka badan!
                </p>
              </div>
            ) : (
              topProducts.map((item, index) => (
                <div
                  key={item.product.id}
                  className="group/item flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-100 hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                        : index === 1
                        ? "bg-gradient-to-br from-slate-400 to-slate-600"
                        : index === 2
                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                        : "bg-gradient-to-br from-blue-400 to-blue-600"
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
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      KES {item.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Recent Sales
          </h3>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-slate-500 text-sm">No sales recorded yet</p>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {new Date(sale.sale_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-500">{sale.sold_by}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">
                      KES {sale.total_sale.toLocaleString()}
                    </p>
                    <p className="text-sm text-green-600">
                      +KES {sale.profit.toLocaleString()}
                    </p>
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
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      bg: "from-blue-50 to-blue-100",
      text: "text-blue-700",
      shadow: "shadow-blue-200",
      glow: "shadow-blue-500/25",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      bg: "from-green-50 to-green-100",
      text: "text-green-700",
      shadow: "shadow-green-200",
      glow: "shadow-green-500/25",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      bg: "from-purple-50 to-purple-100",
      text: "text-purple-700",
      shadow: "shadow-purple-200",
      glow: "shadow-purple-500/25",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      bg: "from-orange-50 to-orange-100",
      text: "text-orange-700",
      shadow: "shadow-orange-200",
      glow: "shadow-orange-500/25",
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-2xl shadow-lg ${colors.shadow} border border-white/50 p-6 hover:shadow-xl hover:${colors.glow} transition-all duration-300 hover:scale-105 cursor-pointer`}
    >
      {/* Floating Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <p
            className={`text-sm font-bold ${colors.text} uppercase tracking-wide`}
          >
            {title}
          </p>
          <p className="text-3xl font-black text-slate-800 mt-3 group-hover:scale-110 transition-transform duration-300">
            {value}
          </p>
        </div>
        <div className="relative">
          {/* Glow Effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300`}
          ></div>
          <div
            className={`relative bg-gradient-to-br ${colors.gradient} p-4 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}
          >
            <Icon className="w-7 h-7 text-white group-hover:animate-pulse" />
          </div>
        </div>
      </div>

      {/* Animated Bottom Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}
      ></div>
    </div>
  );
}
