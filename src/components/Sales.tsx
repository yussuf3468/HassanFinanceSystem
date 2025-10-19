import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import SaleForm from "./SaleForm";
import { formatDate } from "../utils/dateFormatter";
import { useProducts, useSales } from "../hooks/useSupabaseQuery";

export default function Sales() {
  // ✅ Use cached hooks instead of direct queries - saves egress!
  const { data: sales = [], refetch: refetchSales } = useSales();
  const { data: products = [] } = useProducts();
  const [showForm, setShowForm] = useState(false);

  // ❌ Removed useEffect - data now comes from cached hooks!

  // Sort latest sales first by sale_date (fallback to created_at or id)
  const sortedSales = useMemo(() => {
    const toTime = (s: any) => {
      const d = s?.sale_date || s?.created_at;
      const t = d ? new Date(d).getTime() : 0;
      return Number.isFinite(t) ? t : 0;
    };
    return [...sales].sort((a: any, b: any) => {
      const diff = toTime(b) - toTime(a);
      if (diff !== 0) return diff;
      // Stable fallback when times are equal
      const idA = String(a?.id ?? "");
      const idB = String(b?.id ?? "");
      return idB.localeCompare(idA);
    });
  }, [sales]);

  function getProductById(id: string) {
    return products.find((p) => p.id === id);
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    refetchSales(); // ✅ Use refetch from hook instead of full reload
  }

  async function handleDeleteSale(saleId: string, productName: string) {
    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto iibkan?\n\nDelete this sale record for "${productName}"?\n\nTani kama noqon karto - This cannot be undone!`;

    if (!confirm(deleteMessage)) return;

    try {
      const { error } = await supabase.from("sales").delete().eq("id", saleId);

      if (error) {
        console.error("Error deleting sale:", error);
        alert("Failed to delete sale record. Please try again.");
        return;
      }

      alert(`✅ Sale record deleted successfully!`);
      refetchSales(); // ✅ Use refetch from hook
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Failed to delete sale record. Please try again.");
    }
  }

  // ✅ Loading state now comes from React Query
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center py-12">
  //       <div className="text-white text-base font-medium">Loading sales...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            Sales Records
          </h2>
          <p className="text-slate-300 mt-0.5 text-xs sm:text-sm">
            Track all your bookstore sales
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 w-full sm:w-auto font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Record Sale</span>
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Sale
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Sold By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No sales yet. Click "Record Sale" to get started.
                  </td>
                </tr>
              ) : (
                sortedSales.map((sale) => {
                  const product = getProductById(sale.product_id);
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-200">
                        {formatDate(sale.sale_date)}
                        <br />
                        <span className="text-xs text-slate-400">
                          {new Date(sale.sale_date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-white/20"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                              <span className="text-slate-400 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-sm">
                              {product?.name || "Unknown"}
                            </p>
                            {product?.description && (
                              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-500">
                              {product?.product_id || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-semibold">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        KES {sale.total_sale.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                          +KES {sale.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-medium">
                        {sale.sold_by}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleDeleteSale(
                              sale.id,
                              product?.name || "Unknown Product"
                            )
                          }
                          className="inline-flex items-center justify-center w-8 h-8 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-all duration-200 border border-rose-500/30 hover:border-rose-500/50"
                          title="Tirtir Iibkan - Delete Sale"
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
        <SaleForm
          products={products}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
