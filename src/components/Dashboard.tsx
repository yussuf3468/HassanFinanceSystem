import { useMemo } from "react";
import {
  Banknote,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Boxes,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useProducts,
  useRecentSales,
  useSalesTotals,
} from "../hooks/useSupabaseQuery";
import type { Product, Sale } from "../types";
import { formatDate } from "../utils/dateFormatter";
import OptimizedImage from "./OptimizedImage";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(1)}K`;
  return `KES ${value}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const r = startOfDay(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function Dashboard() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: recentSales = [], isLoading: salesLoading } =
    useRecentSales(500);
  const { data: salesTotals, isLoading: totalsLoading } = useSalesTotals();

  const loading = productsLoading || salesLoading || totalsLoading;

  const view = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);

    // Period totals from recent sales (for week/month). All-time + today come from RPC.
    let weekSales = 0,
      weekProfit = 0,
      monthSales = 0,
      monthProfit = 0;
    const todaysTxnIds = new Set<string>();
    const todaysSales: Sale[] = [];

    for (const s of recentSales) {
      const ts = new Date(s.created_at).getTime();
      if (ts >= weekStart.getTime()) {
        weekSales += s.total_sale || 0;
        weekProfit += s.profit || 0;
      }
      if (ts >= monthStart.getTime()) {
        monthSales += s.total_sale || 0;
        monthProfit += s.profit || 0;
      }
      if (ts >= todayStart.getTime()) {
        todaysSales.push(s);
        const anyTxn = (s as any).transaction_id;
        if (anyTxn) todaysTxnIds.add(String(anyTxn));
      }
    }

    // Today's metrics
    const todayRevenue = salesTotals?.today_sales ?? 0;
    const todayProfit = salesTotals?.today_profit ?? 0;
    const todayCount = todaysTxnIds.size || todaysSales.length;
    const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

    // Top products from last 500 sales
    const productMap = new Map(products.map((p) => [p.id, p]));
    const productAgg = new Map<
      string,
      { revenue: number; qty: number; profit: number }
    >();
    for (const s of recentSales) {
      const a = productAgg.get(s.product_id) || {
        revenue: 0,
        qty: 0,
        profit: 0,
      };
      a.revenue += s.total_sale || 0;
      a.qty += s.quantity_sold || 0;
      a.profit += s.profit || 0;
      productAgg.set(s.product_id, a);
    }
    const topProducts = Array.from(productAgg.entries())
      .map(([pid, agg]) => ({
        product: productMap.get(pid),
        ...agg,
      }))
      .filter((x): x is { product: Product; revenue: number; qty: number; profit: number } => !!x.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Daily series for last 7 days (chart)
    const daySeries: Array<{
      day: string;
      label: string;
      revenue: number;
      profit: number;
    }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      let rev = 0,
        pft = 0;
      for (const s of recentSales) {
        const ts = new Date(s.created_at).getTime();
        if (ts >= d.getTime() && ts < nextDay.getTime()) {
          rev += s.total_sale || 0;
          pft += s.profit || 0;
        }
      }
      daySeries.push({
        day: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en-KE", { weekday: "short" }),
        revenue: rev,
        profit: pft,
      });
    }

    // Low stock list
    const lowStock = products
      .filter((p) => p.quantity_in_stock <= (p.reorder_level || 5))
      .sort((a, b) => a.quantity_in_stock - b.quantity_in_stock)
      .slice(0, 6);

    const totalStock = products.reduce(
      (sum, p) => sum + (p.quantity_in_stock || 0),
      0,
    );

    return {
      now,
      todayRevenue,
      todayProfit,
      todayCount,
      avgTicket,
      weekSales,
      weekProfit,
      monthSales,
      monthProfit,
      allTimeSales: salesTotals?.total_sales ?? 0,
      allTimeProfit: salesTotals?.total_profit ?? 0,
      topProducts,
      recentSales: recentSales.slice(0, 8),
      daySeries,
      lowStock,
      totalStock,
      totalProducts: products.length,
    };
  }, [recentSales, products, salesTotals]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const today = view.now.toLocaleDateString("en-KE", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {today}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
            Overview
          </h1>
        </div>
      </div>

      {/* ============ TODAY METRICS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Today's revenue"
          value={formatCurrency(view.todayRevenue)}
          icon={Banknote}
          accent="emerald"
        />
        <MetricCard
          label="Today's profit"
          value={formatCurrency(view.todayProfit)}
          icon={TrendingUp}
          accent="sky"
        />
        <MetricCard
          label="Transactions"
          value={String(view.todayCount)}
          subvalue={
            view.avgTicket > 0
              ? `Avg ${formatCurrency(view.avgTicket)}`
              : undefined
          }
          icon={ShoppingCart}
          accent="indigo"
        />
        <MetricCard
          label="Items in stock"
          value={view.totalStock.toLocaleString()}
          subvalue={`${view.totalProducts} products`}
          icon={Boxes}
          accent="amber"
        />
      </div>

      {/* ============ CHART + PERIOD TOTALS ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Last 7 days
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Revenue · Profit
            </span>
          </div>
          <div className="h-56 -ml-3 -mr-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={view.daySeries}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-slate-500 dark:text-slate-400"
                  tickFormatter={(v) => formatCompactCurrency(v).replace("KES ", "")}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                  formatter={(v: any, name: any) => [
                    formatCurrency(Number(v)),
                    name === "revenue" ? "Revenue" : "Profit",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2.2}
                  fill="url(#revGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#0ea5e9"
                  strokeWidth={2.2}
                  fill="url(#profitGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Period totals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Period totals
          </h2>
          <div className="space-y-3">
            <PeriodRow
              label="Today"
              revenue={view.todayRevenue}
              profit={view.todayProfit}
            />
            <PeriodRow
              label="This week"
              revenue={view.weekSales}
              profit={view.weekProfit}
            />
            <PeriodRow
              label="This month"
              revenue={view.monthSales}
              profit={view.monthProfit}
            />
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <PeriodRow
                label="All time"
                revenue={view.allTimeSales}
                profit={view.allTimeProfit}
                emphasis
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============ THREE COLUMNS: TOP / RECENT / LOW STOCK ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <Panel
          title="Top selling products"
          subtitle={`Based on last ${recentSales.length} sales`}
          icon={TrendingUp}
        >
          {view.topProducts.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No sales yet"
              hint="Top products will appear here once you record sales."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {view.topProducts.map((p, idx) => (
                <li
                  key={p.product.id}
                  className="py-2.5 flex items-center gap-3"
                >
                  <span
                    className={`w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                      idx === 0
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {p.product.image_url ? (
                    <OptimizedImage
                      src={p.product.image_url}
                      alt={p.product.name}
                      className="w-9 h-9 object-cover rounded-md border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      preset="thumbnail"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {p.product.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.qty} sold
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.revenue)}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatCurrency(p.profit)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent sales */}
        <Panel
          title="Recent sales"
          subtitle="Latest transactions"
          icon={Receipt}
        >
          {view.recentSales.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No sales recorded"
              hint="Recent transactions will show here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {view.recentSales.map((s) => {
                const product = products.find((p) => p.id === s.product_id);
                return (
                  <li
                    key={s.id}
                    className="py-2.5 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {product?.name || "Product"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {s.sold_by} · {formatDate(s.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(s.total_sale)}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{formatCurrency(s.profit)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Low stock */}
        <Panel
          title="Low stock"
          subtitle={
            view.lowStock.length > 0
              ? `${view.lowStock.length} item${view.lowStock.length === 1 ? "" : "s"} need attention`
              : "All good"
          }
          icon={AlertTriangle}
          accentClass={
            view.lowStock.length > 0
              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              : undefined
          }
        >
          {view.lowStock.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Stock levels look healthy"
              hint="Products under their reorder level will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {view.lowStock.map((p) => {
                const oos = p.quantity_in_stock <= 0;
                return (
                  <li key={p.id} className="py-2.5 flex items-center gap-3">
                    {p.image_url ? (
                      <OptimizedImage
                        src={p.image_url}
                        alt={p.name}
                        className="w-9 h-9 object-cover rounded-md border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        preset="thumbnail"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reorder at {p.reorder_level || 5}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-md flex-shrink-0 ${
                        oos
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {oos ? "Out" : `${p.quantity_in_stock} left`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTS
// ============================================================

interface MetricCardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ElementType;
  accent: "emerald" | "sky" | "indigo" | "amber";
}

function MetricCard({ label, value, subvalue, icon: Icon, accent }: MetricCardProps) {
  const accentClasses: Record<MetricCardProps["accent"], string> = {
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1 truncate">
            {value}
          </p>
          {subvalue && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subvalue}
            </p>
          )}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentClasses[accent]}`}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

interface PeriodRowProps {
  label: string;
  revenue: number;
  profit: number;
  emphasis?: boolean;
}

function PeriodRow({ label, revenue, profit, emphasis }: PeriodRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span
        className={`text-xs ${
          emphasis
            ? "font-bold text-slate-900 dark:text-white"
            : "text-slate-500 dark:text-slate-400 font-medium"
        }`}
      >
        {label}
      </span>
      <div className="text-right">
        <p
          className={`${
            emphasis ? "text-base font-black" : "text-sm font-bold"
          } text-slate-900 dark:text-white`}
        >
          {formatCurrency(revenue)}
        </p>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-0.5">
          <ArrowUpRight className="w-3 h-3" />
          {formatCurrency(profit)}
        </p>
      </div>
    </div>
  );
}

interface PanelProps {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accentClass?: string;
  children: React.ReactNode;
}

function Panel({ title, subtitle, icon: Icon, accentClass, children }: PanelProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            accentClass ||
            "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: string;
  hint: string;
}) {
  return (
    <div className="text-center py-8 px-2">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
        {hint}
      </p>
    </div>
  );
}
