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
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 text-xs font-bold backdrop-blur-xl">
          <TrendingUp className="w-3 h-3" />
          Soo Qaad - Receipt
        </span>
      );
    }
    if (lowerReason.includes("sale")) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/50 text-rose-200 text-xs font-bold backdrop-blur-xl">
          <TrendingDown className="w-3 h-3" />
          Iib - Sale
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/25 border border-blue-400/50 text-blue-200 text-xs font-bold backdrop-blur-xl">
        <FileText className="w-3 h-3" />
        Hagaaji - Adjustment
      </span>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4 flex justify-center items-start sm:items-center">
        <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-3xl rounded-3xl shadow-2xl max-w-7xl w-full border border-white/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stunning Header */}
          <div className="relative bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-blue-600/30 border-b border-white/20 px-4 sm:px-6 py-4 sm:py-6 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,58,237,0.1),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 border-2 border-purple-400/50 shadow-lg shadow-purple-500/20 backdrop-blur-xl">
                  <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-purple-100 drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    Taariikhda Alaabta - Stock Audit Trail
                  </h3>
                  <p className="text-purple-100 text-xs sm:text-sm mt-0.5 sm:mt-1">
                    Audit trail waa diiwaan muujinaya cidda wax beddeshay,
                    goorta ay beddeshay, iyo waxa la beddelay gudaha nidaamka -
                    Raadi dhammaan isbeddelada alaabta
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 hover:bg-white/20 rounded-xl transition-all hover:scale-110 backdrop-blur-xl border border-white/10 hover:border-white/30"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow" />
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Filters and Search Bar */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Raadi magaca alaabta..."
                    className="w-full bg-white/15 border-2 border-white/30 rounded-xl sm:rounded-2xl pl-12 pr-4 py-3 sm:py-4 text-white text-sm sm:text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/60 transition-all shadow-lg backdrop-blur-xl"
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
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all backdrop-blur-xl shadow-lg border-2 ${
                        filter === f
                          ? "bg-gradient-to-r from-purple-600/40 to-indigo-600/40 border-purple-400/50 text-white scale-105"
                          : "bg-white/10 border-white/20 text-slate-200 hover:border-white/40 hover:scale-105"
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
                  className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all backdrop-blur-xl shadow-lg border-2 bg-gradient-to-r from-emerald-600/40 to-green-600/40 border-emerald-400/50 text-white hover:scale-105 active:scale-95 disabled:opacity-50"
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
                <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 mx-auto mb-4 animate-spin" />
                <p className="text-white font-bold text-base sm:text-lg">
                  Soo raraya...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredMovements.length === 0 && (
              <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-white/5 to-white/10 border-2 border-dashed border-white/30 rounded-2xl sm:rounded-3xl backdrop-blur-xl">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                  <FileText className="relative w-16 h-16 sm:w-20 sm:h-20 text-slate-400 mx-auto mb-4 opacity-60 drop-shadow-lg" />
                </div>
                <p className="text-slate-200 font-bold text-base sm:text-lg mb-2 drop-shadow">
                  Ma jiro wax taariikh ah
                </p>
                <p className="text-slate-400 text-sm sm:text-base">
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
                    className="bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-white/50 transition-all shadow-xl hover:shadow-2xl backdrop-blur-xl hover:scale-[1.01]"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Product Image & Info */}
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600/40 to-slate-700/40 flex items-center justify-center border-2 border-white/30 overflow-hidden flex-shrink-0 shadow-xl backdrop-blur-xl">
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
                          <h5 className="text-white font-bold text-sm sm:text-base lg:text-lg truncate drop-shadow">
                            {movement.product?.name || "Unknown Product"}
                          </h5>
                          <p className="text-slate-300 text-xs sm:text-sm truncate">
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
                          <p className="text-slate-300 text-xs font-semibold mb-1">
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
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs sm:text-sm mb-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-semibold">
                              {formatDate(movement.created_at)}
                            </span>
                          </div>
                          {movement.received_by && (
                            <p className="text-blue-300 text-xs sm:text-sm font-bold mb-1">
                              👤 {movement.received_by}
                            </p>
                          )}
                          {movement.ref_type && (
                            <p className="text-slate-400 text-xs">
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
              <div className="mt-6 pt-4 border-t-2 border-white/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-slate-300 text-sm sm:text-base">
                  <span className="font-bold text-white">
                    {filteredMovements.length}
                  </span>{" "}
                  {filteredMovements.length === 1 ? "isbeddel" : "isbeddelo"}
                </div>
                <div className="flex gap-2 text-xs sm:text-sm">
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-bold backdrop-blur-xl">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Soo Qaadid:{" "}
                    {
                      filteredMovements.filter((m) =>
                        m.reason.toLowerCase().includes("receipt")
                      ).length
                    }
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 font-bold backdrop-blur-xl">
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
