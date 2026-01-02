import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/dateFormatter";
import { useProducts, useReturns } from "../hooks/useSupabaseQuery";
import { invalidateAfterReturn } from "../utils/cacheInvalidation";
import ReturnForm from "./ReturnForm";

export default function Returns() {
  const queryClient = useQueryClient();
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

  async function handleDeleteReturn(
    returnId: string,
    productId: string,
    qty: number,
    productName: string
  ) {
    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto soo celintan?\n\nDelete this return record for "${productName}"?\n\nThis will also reverse the refund in sales records.\n\nTani kama noqon karto - This cannot be undone!`;
    if (!confirm(deleteMessage)) return;

    try {
      // Get return details before deleting
      const { data: returnData } = await supabase
        .from("returns")
        .select("*")
        .eq("id", returnId)
        .single();

      // Delete return record
      const { error } = await supabase
        .from("returns")
        .delete()
        .eq("id", returnId);
      if (error) {
        console.error("Error deleting return:", error);
        alert("Failed to delete return record.");
        return;
      }

      // Update inventory: Subtract returned quantity from stock since return is being deleted
      const prod = getProductById(productId);
      if (prod) {
        const newStock = Math.max(prod.quantity_in_stock - qty, 0);
        const { error: updateError } = await supabase
          .from("products")
          .update({ quantity_in_stock: newStock })
          .eq("id", productId);

        if (updateError) {
          console.error("Error updating inventory:", updateError);
          alert(
            "Return deleted but failed to update inventory. Please update stock manually."
          );
        }

        // Reverse the negative sale entry: Add back positive sale to restore revenue
        if (returnData) {
          const { error: saleError } = await supabase.from("sales").insert({
            product_id: productId,
            quantity_sold: qty, // Positive quantity
            selling_price: returnData.unit_price || prod.selling_price,
            buying_price: prod.buying_price,
            total_sale: returnData.total_refund || returnData.unit_price * qty, // Positive total
            profit: (returnData.unit_price - prod.buying_price) * qty, // Positive profit
            payment_method: returnData.payment_method || "Cash",
            sold_by: returnData.processed_by,
            sale_date: new Date().toISOString(),
            original_price: returnData.unit_price || prod.selling_price,
            final_price: returnData.unit_price || prod.selling_price,
            discount_percentage: 0,
            discount_amount: 0,
          });

          if (saleError) {
            console.error("Error reversing refund in sales:", saleError);
            alert(
              "Return deleted but failed to reverse sales entry. Revenue may be incorrect."
            );
          }
        }
      }

      alert("✅ Return record deleted successfully!");

      // ✅ Invalidate caches to update dashboard
      await invalidateAfterReturn(queryClient);
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
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Returns
          </h2>
          <p className="text-slate-900/80 mt-0.5 text-xs sm:text-sm">
            Customer product returns & stock restorations
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white px-4 py-2.5 rounded-2xl hover:scale-105 transition-all duration-300 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 w-full sm:w-auto font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Return</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-white via-amber-50/15 to-white border border-amber-200/60 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amber-50/40 border-b border-amber-200/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Qty Returned
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Refund
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Processed By
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-900/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/50">
              {returns.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-900/70"
                  >
                    No returns recorded yet.
                  </td>
                </tr>
              ) : (
                sortedReturns.map((r: any) => {
                  const product = getProductById(r.product_id);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gradient-to-br hover:from-amber-50/40 hover:to-white transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-900">
                        {formatDate(r.return_date || r.created_at)}
                        <br />
                        <span className="text-xs text-slate-700">
                          {new Date(
                            r.return_date || r.created_at
                          ).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-xl border border-amber-300/70 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center border border-amber-300/70 shadow-sm">
                              <span className="text-slate-700 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 text-sm">
                              {product?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {product?.product_id || "-"}
                            </p>
                            {r.sale_id && (
                              <p className="text-[10px] text-slate-700">
                                Sale: {r.sale_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-semibold">
                        {r.quantity_returned}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        KES {Number(r.total_refund || 0).toLocaleString()}
                      </td>
                      <td
                        className="px-6 py-4 text-slate-600 text-xs max-w-[150px] truncate"
                        title={r.reason}
                      >
                        {r.reason || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600 border border-rose-300">
                          {r.condition || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {r.processed_by}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {r.status || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleDeleteReturn(
                              r.id,
                              r.product_id,
                              r.quantity_returned,
                              product?.name || "Unknown Product"
                            )
                          }
                          className="inline-flex items-center justify-center w-8 h-8 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl transition-all duration-200 border border-rose-300 hover:border-rose-400"
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
