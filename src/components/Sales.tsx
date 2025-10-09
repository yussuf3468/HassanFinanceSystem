import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Sale, Product } from "../types";
import SaleForm from "./SaleForm";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [salesRes, productsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("*")
          .order("sale_date", { ascending: false }),
        supabase.from("products").select("*"),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (productsRes.error) throw productsRes.error;

      setSales(salesRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getProductById(id: string) {
    return products.find((p) => p.id === id);
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    await loadData();
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
      await loadData();
    } catch (error) {
      console.error("Error deleting sale:", error);
      alert("Failed to delete sale record. Please try again.");
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading sales...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Sales Records
          </h2>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Track all your bookstore sales
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg w-full sm:w-auto font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Record Sale</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Total Sale
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Sold By
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No sales yet. Click "Record Sale" to get started.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const product = getProductById(sale.product_id);
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(sale.sale_date).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-slate-500">
                          {new Date(sale.sale_date).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product?.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                              <span className="text-slate-400 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">
                              {product?.name || "Unknown"}
                            </p>
                            {product?.description && (
                              <p className="text-xs text-slate-600 truncate max-w-[200px]">
                                {product.description}
                              </p>
                            )}
                            <p className="text-sm text-slate-500">
                              {product?.product_id || "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        KES {sale.total_sale.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          +KES {sale.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
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
                          className="inline-flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
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
