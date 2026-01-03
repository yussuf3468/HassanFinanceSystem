import { useEffect, useState } from "react";
import {
  X,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import OptimizedImage from "./OptimizedImage";

type StockMovement = {
  id: number;
  product_id: string;
  quantity_change: number;
  reason: string;
  ref_type: string | null;
  ref_id: string | null;
  received_by: string | null;
  created_at: string;
  created_by: string | null;
  product?: {
    name: string;
    product_id: string;
    image_url?: string;
  };
};

type FilterType = "all" | "receipt" | "sale" | "adjustment";

export default function StockAuditTrail({ onClose }: { onClose: () => void }) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchMovements() {
    try {
      setRefreshing(true);
      let query = (supabase as any)
        .from("stock_movements")
        .select(
          `
          *,
          product:products(name, product_id, image_url)
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.ilike("reason", `%${filter}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovements((data as any) || []);
    } catch (err) {
      console.error("Failed to fetch stock movements:", err);
      alert("Failed to load audit trail");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchMovements();
  }, [filter]);

  // Trap escape key for close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filteredMovements = movements.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.product?.name.toLowerCase().includes(q) ||
      m.product?.product_id.toLowerCase().includes(q) ||
      m.reason.toLowerCase().includes(q)
    );
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function getReasonBadge(reason: string) {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes("receipt")) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <TrendingUp className="w-3 h-3" />✅ Soo Qaad - Receipt
        </span>
      );
    }
    if (lowerReason.includes("sale")) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold">
          <TrendingDown className="w-3 h-3" />
          💰 Iib - Sale
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-bold">
        <FileText className="w-3 h-3" />
        ⚙️ Hagaaji - Adjustment
      </span>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4 flex justify-center items-start sm:items-center">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-7xl w-full border-2 border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-900/20 border-b-2 border-amber-100 dark:border-amber-700 px-4 sm:px-6 py-5 sm:py-6 overflow-hidden shadow-sm">
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                    📋 Taariikhda Alaabta - Stock Audit Trail
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-1">
                    Audit trail waa diiwaan muujinaya cidda wax beddeshay,
                    goorta ay beddeshay, iyo waxa la beddelay gudaha nidaamka -
                    Raadi dhammaan isbeddelada alaabta
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-xl transition-all hover:scale-110 active:scale-95 text-slate-700 dark:text-slate-300 border border-transparent hover:border-amber-200 dark:hover:border-slate-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Filters and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔍 Raadi magaca alaabta..."
                    className="w-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl sm:rounded-xl pl-12 pr-4 py-3 sm:py-3.5 text-slate-900 dark:text-white text-sm sm:text-base placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 transition-all shadow-sm hover:border-amber-300 dark:hover:border-slate-500"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "receipt", "sale", "adjustment"] as FilterType[]).map(
                  (f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilter(f)}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm border-2 ${
                        filter === f
                          ? "bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400 text-white scale-105"
                          : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-slate-500 hover:scale-105"
                      }`}
                    >
                      <Filter className="w-4 h-4 inline mr-1.5" />
                      {f === "all" && "Dhammaan"}
                      {f === "receipt" && "Soo Qaad"}
                      {f === "sale" && "Iib"}
                      {f === "adjustment" && "Hagaaji"}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={fetchMovements}
                  disabled={refreshing}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm border-2 bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400 text-white hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 inline mr-1.5 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16 sm:py-24">
                <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-700 dark:text-slate-300 font-bold text-base sm:text-lg">
                  ⏳ Soo raraya...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredMovements.length === 0 && (
              <div className="text-center py-16 sm:py-24 bg-amber-50/50 dark:bg-slate-800/50 border-2 border-dashed border-amber-200 dark:border-slate-700 rounded-2xl">
                <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 mx-auto mb-4" />
                <p className="text-slate-900 dark:text-white font-bold text-base sm:text-lg mb-2">
                  📭 Ma jiro wax taariikh ah
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                  Isbeddello lama sameeynin alaabta
                </p>
              </div>
            )}

            {/* Movements List */}
            {!loading && filteredMovements.length > 0 && (
              <div className="space-y-3 sm:space-y-4 max-h-[600px] sm:max-h-[700px] overflow-y-auto pr-1 sm:pr-2">
                {filteredMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-4 sm:p-5 hover:border-amber-300 dark:hover:border-slate-500 transition-all shadow-sm hover:shadow-md hover:scale-[1.01]"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Product Image & Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                          {movement.product?.image_url ? (
                            <OptimizedImage
                              src={movement.product.image_url}
                              alt={movement.product.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                              preset="thumbnail"
                            />
                          ) : (
                            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-slate-900 dark:text-white font-bold text-sm sm:text-base lg:text-lg truncate">
                            {movement.product?.name || "Unknown Product"}
                          </h5>
                          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm truncate">
                            ID: {movement.product?.product_id || "N/A"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {getReasonBadge(movement.reason)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Change */}
                      <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-center">
                          <p className="text-slate-600 text-xs font-semibold mb-1">
                            Isbeddel - Change
                          </p>
                          <div
                            className={`text-2xl sm:text-3xl font-black ${
                              movement.quantity_change > 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {movement.quantity_change > 0 ? "+" : ""}
                            {movement.quantity_change}
                          </div>
                        </div>

                        {/* Date, Time & Staff */}
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-slate-600 text-xs sm:text-sm mb-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold">
                              {formatDate(movement.created_at)}
                            </span>
                          </div>
                          {movement.received_by && (
                            <p className="text-amber-600 text-xs sm:text-sm font-bold mb-1">
                              👤 {movement.received_by}
                            </p>
                          )}
                          {movement.ref_type && (
                            <p className="text-slate-600 text-xs">
                              Ref: {movement.ref_type}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Footer */}
            {!loading && filteredMovements.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-amber-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-slate-700 dark:text-slate-300 text-sm sm:text-base">
                  <span className="font-bold text-slate-900 dark:text-white">
                    📊 {filteredMovements.length}
                  </span>{" "}
                  {filteredMovements.length === 1 ? "isbeddel" : "isbeddelo"}
                </div>
                <div className="flex gap-2 text-xs sm:text-sm">
                  <div className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 font-bold">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Soo Qaadid:{" "}
                    {
                      filteredMovements.filter((m) =>
                        m.reason.toLowerCase().includes("receipt")
                      ).length
                    }
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 font-bold">
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                    Iib:{" "}
                    {
                      filteredMovements.filter((m) =>
                        m.reason.toLowerCase().includes("sale")
                      ).length
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

