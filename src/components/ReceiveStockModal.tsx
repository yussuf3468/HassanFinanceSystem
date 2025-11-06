import { useEffect, useMemo, useState } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Package,
  CheckCircle2,
  TrendingUp,
  Search,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useProducts } from "../hooks/useSupabaseQuery";
import type { Product } from "../types";
import OptimizedImage from "./OptimizedImage";

type LineItem = {
  product?: Product;
  quantity: number;
};

const staffMembers = ["Khalid", "Yussuf"];

export default function ReceiveStockModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { data: products = [] } = useProducts();

  const [items, setItems] = useState<LineItem[]>([]);
  const [search, setSearch] = useState<string>("");
  const [receivedBy, setReceivedBy] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.product_id.toLowerCase().includes(q) ||
        (p.category?.toLowerCase() ?? "").includes(q)
    );
  }, [products, search]);

  function updateItem(idx: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  // Items are added from search results; no manual add button required

  function removeRow(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalUnits = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return alert("Add at least one item.");
    if (!receivedBy) return alert("Please select who received the stock.");
    const normalized = items
      .map((it) => ({
        product_id: it.product?.id,
        quantity: Number(it.quantity) || 0,
        cost_per_unit: null,
        received_by: receivedBy,
      }))
      .filter((i) => i.product_id && i.quantity > 0);

    if (normalized.length === 0)
      return alert("Each line needs a product and quantity > 0.");

    try {
      setSubmitting(true);
      const { data, error } = await (supabase as any).rpc(
        "process_stock_receipt",
        {
          p_items: normalized,
        }
      );
      if (error) throw error;
      setSuccessId(data as string);
      // brief success state then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Failed to process stock receipt", err);
      alert(err?.message || "Failed to receive stock. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Trap escape key for close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto">
      <div className="min-h-screen py-4 sm:py-8 px-3 sm:px-4 flex justify-center items-start sm:items-center">
        <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-3xl rounded-3xl shadow-2xl max-w-7xl w-full border border-white/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stunning Header */}
          <div className="relative bg-gradient-to-r from-emerald-600/30 via-green-600/30 to-teal-600/30 border-b border-white/20 px-4 sm:px-6 py-4 sm:py-6 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-emerald-500/40 to-green-500/40 border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 backdrop-blur-xl">
                  <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-100 drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    Soo Qaad Alaabta - Receive Stock
                  </h3>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 sm:mt-1">
                    Raadi oo ku dar alaabta cusub si degdeg ah
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

          <form onSubmit={handleSubmit} className="p-3 sm:p-6">
            <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 sm:gap-6">
              {/* Left: Search Panel - Mobile First */}
              <div className="lg:col-span-2 order-1">
                <div className="bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-2 border-blue-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl lg:sticky lg:top-6 backdrop-blur-xl">
                  <label className="text-white font-bold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 drop-shadow" />
                    Raadi Alaabta - Search Products
                  </label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/15 border-2 border-white/30 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-white text-sm sm:text-base placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all shadow-lg backdrop-blur-xl"
                    placeholder="Qor magaca alaabta..."
                  />

                  {/* Search Results */}
                  {search && filteredProducts.length > 0 && (
                    <div className="mt-3 sm:mt-4 max-h-[300px] sm:max-h-[450px] overflow-auto space-y-2 rounded-xl sm:rounded-2xl bg-white/5 p-2 backdrop-blur-xl border border-white/10">
                      {filteredProducts.slice(0, 15).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setItems((prev) => {
                              const idx = prev.findIndex(
                                (x) => x.product?.id === p.id
                              );
                              if (idx >= 0) {
                                const copy = [...prev];
                                copy[idx] = {
                                  ...copy[idx],
                                  quantity: (copy[idx].quantity || 0) + 1,
                                };
                                return copy;
                              }
                              return [...prev, { product: p, quantity: 1 }];
                            });
                            setSearch("");
                          }}
                          className="w-full text-left px-3 sm:px-4 py-3 sm:py-4 hover:bg-gradient-to-r hover:from-blue-500/30 hover:to-purple-500/30 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 transition-all border-2 border-transparent hover:border-blue-400/40 group backdrop-blur-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {p.image_url ? (
                            <OptimizedImage
                              src={p.image_url}
                              alt={p.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-white/30 group-hover:border-blue-400/60 transition-all flex-shrink-0 shadow-lg"
                              preset="thumbnail"
                            />
                          ) : (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600/40 to-slate-700/40 flex items-center justify-center border-2 border-white/30 group-hover:border-blue-400/60 transition-all flex-shrink-0 shadow-lg backdrop-blur-xl">
                              <Package className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm sm:text-base truncate group-hover:text-blue-200 transition-colors drop-shadow">
                              {p.name}
                            </p>
                            <p className="text-slate-300 text-xs sm:text-sm truncate">
                              {p.product_id}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-emerald-300 text-xs sm:text-sm font-bold">
                                Stock: {p.quantity_in_stock}
                              </span>
                              <span className="text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30">
                                Riix
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {search && filteredProducts.length === 0 && (
                    <div className="mt-4 text-center py-8 sm:py-12 text-slate-300 text-sm sm:text-base backdrop-blur-xl bg-white/5 rounded-xl border border-white/10">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                      Ma jiro alaab la heli karo
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Selected Items - Mobile Optimized */}
              <div className="lg:col-span-3 order-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold text-base sm:text-lg lg:text-xl flex items-center gap-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 drop-shadow" />
                    Alaabta La Doortay ({items.length})
                  </h4>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-white/5 to-white/10 border-2 border-dashed border-white/30 rounded-2xl sm:rounded-3xl backdrop-blur-xl">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                      <Package className="relative w-16 h-16 sm:w-20 sm:h-20 text-slate-400 mx-auto mb-4 opacity-60 drop-shadow-lg" />
                    </div>
                    <p className="text-slate-200 font-bold text-base sm:text-lg mb-2 drop-shadow">
                      Weli ma aadan dooranin wax alaab ah
                    </p>
                    <p className="text-slate-400 text-sm sm:text-base">
                      Search and click products to add them
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
                    {items.map((it, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/30 rounded-2xl sm:rounded-3xl p-3 sm:p-5 hover:border-white/50 transition-all shadow-xl hover:shadow-2xl backdrop-blur-xl hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Product Image & Info */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-600/40 to-slate-700/40 flex items-center justify-center border-2 border-white/30 overflow-hidden flex-shrink-0 shadow-xl backdrop-blur-xl">
                              {it.product?.image_url ? (
                                <OptimizedImage
                                  src={it.product.image_url}
                                  alt={it.product.name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover"
                                  preset="thumbnail"
                                />
                              ) : (
                                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className="text-white font-bold text-sm sm:text-base lg:text-lg truncate drop-shadow">
                                {it.product?.name || "Unknown"}
                              </h5>
                              <p className="text-slate-300 text-xs sm:text-sm">
                                ID: {it.product?.product_id || "N/A"}
                              </p>
                              <p className="text-emerald-300 text-xs sm:text-sm font-bold mt-1">
                                Stock hadda:{" "}
                                {it.product?.quantity_in_stock || 0}
                              </p>
                            </div>
                          </div>

                          {/* Quantity Controls & Delete */}
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex-1 sm:flex-none">
                              <label className="block text-slate-200 text-xs sm:text-sm font-bold mb-2 text-center">
                                Tirada - Quantity
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(idx, {
                                      quantity: Math.max(
                                        1,
                                        (it.quantity || 1) - 1
                                      ),
                                    })
                                  }
                                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-white/15 to-white/5 border-2 border-white/30 text-white hover:border-white/50 hover:scale-110 active:scale-95 transition-all backdrop-blur-xl shadow-lg"
                                >
                                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={it.quantity}
                                  onChange={(e) =>
                                    updateItem(idx, {
                                      quantity: Math.max(
                                        1,
                                        Number(e.target.value)
                                      ),
                                    })
                                  }
                                  className="w-20 sm:w-24 bg-white/15 border-2 border-emerald-400/50 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-white text-center font-bold text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-emerald-400/70 transition-all shadow-lg backdrop-blur-xl"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateItem(idx, {
                                      quantity: (it.quantity || 0) + 1,
                                    })
                                  }
                                  className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-emerald-600/40 to-green-600/40 border-2 border-emerald-400/50 text-white hover:from-emerald-600/50 hover:to-green-600/50 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 backdrop-blur-xl"
                                >
                                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="p-3 rounded-xl text-rose-400 hover:bg-rose-600/30 border-2 border-transparent hover:border-rose-400/50 transition-all hover:scale-110 active:scale-95 backdrop-blur-xl shadow-lg"
                              title="Tir - Remove"
                            >
                              <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer - Mobile Optimized */}
                {items.length > 0 && (
                  <div className="space-y-4 pt-4 sm:pt-6 border-t-2 border-white/30 mt-4 sm:mt-6">
                    {/* Staff Selection */}
                    <div className="bg-gradient-to-br from-blue-500/15 to-purple-500/15 border-2 border-blue-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-xl">
                      <label className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 drop-shadow" />
                        Qofka Soo Qaaday - Received By *
                      </label>
                      <select
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        required
                        className="w-full bg-white/15 border-2 border-white/30 rounded-xl sm:rounded-2xl px-4 py-3 sm:py-4 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400/60 transition-all shadow-lg backdrop-blur-xl"
                      >
                        <option value="" className="bg-slate-900 text-white">
                          -- Dooro Shaqaalaha / Select Staff --
                        </option>
                        {staffMembers.map((staff) => (
                          <option
                            key={staff}
                            value={staff}
                            className="bg-slate-900 text-white"
                          >
                            {staff}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Summary and Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="bg-gradient-to-r from-emerald-500/25 to-green-500/25 border-2 border-emerald-400/50 rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-4 sm:py-5 backdrop-blur-xl shadow-xl shadow-emerald-500/10">
                        <p className="text-emerald-200 text-xs sm:text-sm font-bold uppercase tracking-wide mb-1">
                          Wadarta - Total Units
                        </p>
                        <p className="text-white font-black text-3xl sm:text-4xl drop-shadow-lg">
                          {totalUnits}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/15 text-white hover:bg-white/25 border-2 border-white/30 hover:border-white/50 transition-all font-bold text-sm sm:text-base backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95"
                        >
                          Ka Noqo - Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            submitting || items.length === 0 || !receivedBy
                          }
                          className="inline-flex items-center justify-center gap-2 sm:gap-3 px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 font-black text-sm sm:text-base lg:text-lg backdrop-blur-xl border-2 border-emerald-400/30"
                        >
                          {successId ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />{" "}
                              La Qaatay!
                            </>
                          ) : submitting ? (
                            "Ku Shaqaynaya..."
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                              Soo Qaad Alaabta
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

