import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/dateFormatter";
import { useProducts, useReturns } from "../hooks/useSupabaseQuery";
import ReturnForm from "./ReturnForm";

export default function Returns() {
  const { data: returns = [], refetch: refetchReturns } = useReturns();
  const { data: products = [] } = useProducts();
  const [showForm, setShowForm] = useState(false);

  const sortedReturns = useMemo(() => {
    const toTime = (r: any) => {
      const d = r?.return_date || r?.created_at;
      const t = d ? new Date(d).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    return [...returns].sort((a: any, b: any) => {
      const diff = toTime(b) - toTime(a);
      if (diff !== 0) return diff;
      const idA = String(a?.id ?? "");
      const idB = String(b?.id ?? "");
      return idB.localeCompare(idA);
    });
  }, [returns]);

  function getProductById(id: string) {
    return products.find((p) => p.id === id);
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    refetchReturns();
  }

  async function handleDeleteReturn(returnId: string, productId: string, qty: number, productName: string) {
    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto soo celintan?\n\nDelete this return record for \"${productName}\"?\n\nTani kama noqon karto - This cannot be undone!`;
    if (!confirm(deleteMessage)) return;

    try {
      // Delete record
      const { error } = await supabase.from("returns").delete().eq("id", returnId);
      if (error) {
        console.error("Error deleting return:", error);
        alert("Failed to delete return record.");
        return;
      }
      // Trigger will auto adjust stock (AFTER DELETE trigger). If trigger not present, uncomment manual update:
      // const prod = getProductById(productId);
      // if (prod) {
      //   await supabase.from("products").update({ quantity_in_stock: Math.max(prod.quantity_in_stock - qty,0) }).eq("id", productId);
      // }
      alert("✅ Return record deleted successfully!");
      refetchReturns();
    } catch (err) {
      console.error("Error deleting return:", err);
      alert("Failed to delete return record.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">Returns</h2>
          <p className="text-slate-300 mt-0.5 text-xs sm:text-sm">Customer product returns & stock restorations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white px-4 py-2.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-xl shadow-rose-500/25 hover:shadow-2xl hover:shadow-rose-500/40 w-full sm:w-auto font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Return</span>
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Qty Returned</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Refund</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Condition</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Processed By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">No returns recorded yet.</td>
                </tr>
              ) : (
                sortedReturns.map((r: any) => {
                  const product = getProductById(r.product_id);
                  return (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-slate-200">
                        {formatDate(r.return_date || r.created_at)}<br />
                        <span className="text-xs text-slate-400">{new Date(r.return_date || r.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product?.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-white/20" />
                          ) : (
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                              <span className="text-slate-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm">{product?.name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{product?.product_id || "-"}</p>
                            {r.sale_id && <p className="text-[10px] text-slate-400">Sale: {r.sale_id}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-semibold">{r.quantity_returned}</td>
                      <td className="px-6 py-4 font-bold text-white">KES {Number(r.total_refund || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-300 text-xs max-w-[150px] truncate" title={r.reason}>{r.reason || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30">{r.condition || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-medium">{r.processed_by}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">{r.status || 'pending'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteReturn(r.id, r.product_id, r.quantity_returned, product?.name || 'Unknown Product')}
                          className="inline-flex items-center justify-center w-8 h-8 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-all duration-200 border border-rose-500/30 hover:border-rose-500/50"
                          title="Tirtir Soo Celin - Delete Return"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ReturnForm
          products={products}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
