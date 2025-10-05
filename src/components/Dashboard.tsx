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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={`KES ${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Profit"
          value={`KES ${stats.totalProfit.toLocaleString()}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount.toString()}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Top Selling Products
          </h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-slate-500 text-sm">No sales data yet</p>
            ) : (
              topProducts.map((item, index) => (
                <div
                  key={item.product.id}
                  className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
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
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-slate-500 to-slate-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div
          className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
