import { useMemo, useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import SaleForm from "./SaleForm";
import { formatDate } from "../utils/dateFormatter";
import { useProducts, useSales } from "../hooks/useSupabaseQuery";
import { invalidateAfterSale } from "../utils/cacheInvalidation";

export default function Sales() {
  const queryClient = useQueryClient();
  // ✅ Use cached hooks instead of direct queries - saves egress!
  const { data: sales = [], refetch: refetchSales, isRefetching } = useSales();
  const { data: products = [] } = useProducts();
  const [showForm, setShowForm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

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

  // Pagination logic
  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedSales = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return sortedSales.slice(startIdx, endIdx);
  }, [sortedSales, currentPage, itemsPerPage]);

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
    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto iibkan?\n\nDelete this sale record for "${productName}"?\n\n⚠️ This will restore the product quantity back to inventory.\n\nTani kama noqon karto - This cannot be undone!`;

    if (!confirm(deleteMessage)) return;

    try {
      // ✅ First, get the sale details to restore stock
      const { data: saleData, error: fetchError } = await supabase
        .from("sales")
        .select("product_id, quantity_sold")
        .eq("id", saleId)
        .single();

      if (fetchError) {
        console.error("Error fetching sale data:", fetchError);
        alert("Failed to fetch sale details. Please try again.");
        return;
      }

      // Delete the sale record
      const { error: deleteError } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId);

      if (deleteError) {
        console.error("Error deleting sale:", deleteError);
        alert("Failed to delete sale record. Please try again.");
        return;
      }

      // ✅ Restore the product stock
      const product = getProductById(saleData.product_id);
      if (product) {
        const restoredStock =
          product.quantity_in_stock + saleData.quantity_sold;
        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity_in_stock: restoredStock })
          .eq("id", saleData.product_id);

        if (stockError) {
          console.error("Error restoring stock:", stockError);
          alert(
            "⚠️ Sale deleted but failed to restore inventory. Please manually update stock for " +
              product.name
          );
        }
      }

      // ✅ Invalidate caches to update dashboard and inventory
      await invalidateAfterSale(queryClient);

      alert(`✅ Sale record deleted and stock restored successfully!`);
      refetchSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Failed to delete sale record. Please try again.");
    }
  }

  // ✅ Loading state now comes from React Query
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center py-12">
  //       <div className="text-slate-900 text-base font-medium">Loading sales...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Sales Records
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Track all your bookstore sales ({sales.length} total)
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => refetchSales()}
            disabled={isRefetching}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white px-4 py-2.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-400 dark:border-amber-500"
            title="Refresh sales data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white px-4 py-2.5 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex-1 sm:flex-initial font-semibold text-sm border-2 border-emerald-400 dark:border-emerald-500"
          >
            <Plus className="w-4 h-4" />
            <span>Record Sale</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b-2 border-amber-100 dark:border-slate-600">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Sale
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sold By
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-600 dark:text-slate-400"
                  >
                    No sales yet. Click "Record Sale" to get started.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => {
                  const product = getProductById(sale.product_id);
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                        {formatDate(sale.created_at)}
                        <br />
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(sale.created_at).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-600">
                              <span className="text-slate-400 dark:text-slate-500 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {product?.name || "Unknown"}
                            </p>
                            {product?.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {product?.product_id || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-semibold">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        KES {sale.total_sale.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
                          +KES {sale.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-200 font-medium">
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
                          className="inline-flex items-center justify-center w-8 h-8 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 border border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600"
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

      {/* Pagination Controls */}
      {sortedSales.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm rounded-xl transition-colors duration-200">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedSales.length)} of{" "}
            {sortedSales.length} sales
          </div>

          <div className="flex items-center gap-3">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors duration-200"
            >
              <option
                value={25}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                25 per page
              </option>
              <option
                value={50}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                50 per page
              </option>
              <option
                value={100}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                100 per page
              </option>
              <option
                value={200}
                className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                200 per page
              </option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

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
