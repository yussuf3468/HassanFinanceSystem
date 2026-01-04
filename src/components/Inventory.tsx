import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  CreditCard as Edit2,
  Trash2,
  AlertCircle,
  Package,
  Eye,
  X,
  Calendar,
  DollarSign,
  Hash,
  Tag,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useProducts } from "../hooks/useSupabaseQuery";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import ProductForm from "./ProductForm";
import ReceiveStockModal from "./ReceiveStockModal";
import StockAuditTrail from "./StockAuditTrail";
import OptimizedImage from "./OptimizedImage";
import { formatDate } from "../utils/dateFormatter";

export default function Inventory() {
  const { data: products = [], isLoading: loading, refetch } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Persist viewingProduct in sessionStorage
  const [viewingProduct, setViewingProduct] = useState<Product | null>(() => {
    const saved = sessionStorage.getItem("inventory_viewingProduct");
    return saved ? JSON.parse(saved) : null;
  });

  // Save modal state to sessionStorage whenever it changes
  useEffect(() => {
    if (viewingProduct) {
      sessionStorage.setItem(
        "inventory_viewingProduct",
        JSON.stringify(viewingProduct)
      );
    } else {
      sessionStorage.removeItem("inventory_viewingProduct");
    }
  }, [viewingProduct]);

  // Sort products newest-first by created_at (fallback to id)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aDate !== bDate) return bDate - aDate;
      return b.id.localeCompare(a.id);
    });
  }, [products]);

  // Pagination logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return sortedProducts.slice(startIdx, endIdx);
  }, [sortedProducts, currentPage, itemsPerPage]);

  async function handleDelete(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto "${product.name}"?\n\nTani waxay u baahan tahay:\n1. Tirtirka dhammaan iibkii (sales) ee ku saabsan alaabtan\n2. Tirtirka dhammaan order items ee ku saabsan alaabtan\n3. Tirtirka alaabta (product) guud ahaan\n\nAre you sure you want to delete "${product.name}"?\n\nThis will:\n1. Delete ALL sales records for this product\n2. Delete ALL order items for this product\n3. Delete the product completely\n\nThis action cannot be undone!`;

    if (!confirm(deleteMessage)) return;

    try {
      // First delete all sales records for this product
      const { error: salesError } = await supabase
        .from("sales")
        .delete()
        .eq("product_id", id);

      if (salesError) {
        console.error("Error deleting sales:", salesError);
        alert("Failed to delete sales records. Please try again.");
        return;
      }

      // Then delete all order items for this product
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("product_id", id);

      if (orderItemsError) {
        console.error("Error deleting order items:", orderItemsError);
        alert("Failed to delete order items. Please try again.");
        return;
      }

      // Finally delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (productError) {
        console.error("Error deleting product:", productError);
        alert("Failed to delete product. Please try again.");
        return;
      }

      alert(
        `✅ Successfully deleted "${product.name}" and all related records!`
      );
      refetch();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product. Please try again.");
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleView(product: Product) {
    setViewingProduct(product);
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCloseView() {
    setViewingProduct(null);
    // sessionStorage will be cleared by useEffect
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleFormSuccess() {
    handleCloseForm();
    refetch();
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-700 dark:text-slate-300">
        ⏳ Loading inventory...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Inventory Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
            Manage your bookstore products
          </p>
        </div>

        {/* Mobile First: Stack all buttons vertically on mobile, then horizontal on larger screens */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 text-white px-5 py-3 rounded-xl hover:from-emerald-600 hover:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1 border-2 border-emerald-400 dark:border-emerald-500"
            title="Record a new stock receipt"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Alaab timid - Receive Stock</span>
          </button>
          <button
            onClick={() => setShowAudit(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white px-5 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1 border-2 border-amber-400 dark:border-amber-500"
            title="View stock movement history"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Raadraac</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white px-5 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1 border-2 border-amber-400 dark:border-amber-500"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 border-b-2 border-amber-100 dark:border-amber-900/30">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Qiimaha Iibsiga - Buying Price
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Qiimaha Iibka - Selling Price
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-600 dark:text-slate-400"
                  >
                    No products yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isLowStock =
                    product.quantity_in_stock <= product.reorder_level;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <button
                              onClick={() => handleView(product)}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                              <OptimizedImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-600"
                                preset="thumbnail"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleView(product)}
                              className="w-12 h-12 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border-2 border-slate-200 dark:border-slate-600"
                            >
                              <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            </button>
                          )}
                          <div>
                            <button
                              onClick={() => handleView(product)}
                              className="font-semibold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors text-left"
                            >
                              {product.name}
                            </button>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {product.product_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-semibold">
                        KES {product.buying_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">
                        KES {product.selling_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              isLowStock
                                ? "bg-red-50 text-red-700 border border-red-300"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            }`}
                          >
                            {product.quantity_in_stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(product)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-300"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-300"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <p>No products found. Add your first product to get started!</p>
          </div>
        ) : (
          paginatedProducts.map((product) => {
            const isLowStock =
              product.quantity_in_stock <= product.reorder_level;
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-md border-2 border-slate-100 p-4 hover:border-amber-300 transition-all hover:shadow-lg"
              >
                <div className="flex items-start space-x-4">
                  {product.image_url ? (
                    <button
                      onClick={() => handleView(product)}
                      className="flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <OptimizedImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-2xl border-2 border-amber-300/70 shadow-amber-100/50/60 shadow-sm"
                        preset="thumbnail"
                      />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleView(product)}
                      className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center hover:bg-amber-100 transition-colors border-2 border-slate-200"
                    >
                      <Package className="w-7 h-7 text-slate-400" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleView(product)}
                          className="font-semibold text-slate-900 hover:text-amber-400 transition-colors text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-sm text-slate-700 ">
                          ID: {product.product_id}
                        </p>
                        <p className="text-sm text-slate-700 ">
                          {product.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => handleView(product)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-300"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-transparent hover:border-amber-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Buy Price</p>
                        <p className="font-bold text-slate-900">
                          KES {product.buying_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Sell Price</p>
                        <p className="font-medium text-slate-700">
                          KES {product.selling_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Stock</p>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock
                                ? "bg-red-50 text-red-700 border border-red-300"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            }`}
                          >
                            {product.quantity_in_stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {sortedProducts.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white border-2 border-slate-100 shadow-sm rounded-xl">
          <div className="text-sm text-slate-700">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, sortedProducts.length)} of{" "}
            {sortedProducts.length} products
          </div>

          <div className="flex items-center gap-3">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              style={{
                colorScheme: "light",
              }}
            >
              <option value={25} className="bg-white text-slate-900">
                25 per page
              </option>
              <option value={50} className="bg-white text-slate-900">
                50 per page
              </option>
              <option value={100} className="bg-white text-slate-900">
                100 per page
              </option>
              <option value={200} className="bg-white text-slate-900">
                200 per page
              </option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-900 text-sm hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-sm text-slate-700 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-900 text-sm hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-4 px-4 flex justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full h-fit my-4 max-h-[calc(100vh-2rem)] overflow-y-auto border-2 border-slate-100 dark:border-slate-700">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-900/20 border-b-2 border-amber-100 dark:border-amber-700 px-6 py-5 rounded-t-3xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {viewingProduct.name}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Product ID: {viewingProduct.product_id}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseView}
                    className="p-2.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-all hover:scale-110 active:scale-95 text-slate-700 dark:text-slate-300 border border-transparent hover:border-amber-200 dark:hover:border-amber-700"
                  >
                    <X className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  </button>
                </div>
              </div>
              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <div className="relative group">
                      {viewingProduct.image_url ? (
                        <OptimizedImage
                          src={viewingProduct.image_url}
                          alt={viewingProduct.name}
                          className="w-full h-80 lg:h-96 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                          preset="large"
                        />
                      ) : (
                        <div className="w-full h-80 lg:h-96 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center border-2 border-slate-200 dark:border-slate-600">
                          <div className="text-center">
                            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-700 dark:text-slate-300 font-semibold">
                              No Image Available
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                              Upload an image to enhance product display
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Category Badge */}
                    <div>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                        <Tag className="w-4 h-4 mr-2" />
                        {viewingProduct.category}
                      </span>
                    </div>

                    {/* Product Description */}
                    {viewingProduct.description && (
                      <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center">
                          <Eye className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
                          Product Description
                        </h4>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {viewingProduct.description}
                        </p>
                      </div>
                    )}

                    {/* Price Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
                            Buying Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          KES {viewingProduct.buying_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                          Cost per unit
                        </p>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl border-2 border-blue-300 dark:border-blue-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <h4 className="font-semibold text-blue-700 dark:text-blue-300">
                            Selling Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          KES {viewingProduct.selling_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Price per unit
                        </p>
                      </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-1">
                            Profit Margin
                          </h4>
                          <p className="text-2xl font-bold text-amber-700">
                            KES{" "}
                            {(
                              viewingProduct.selling_price -
                              viewingProduct.buying_price
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm text-amber-600">
                            {(
                              ((viewingProduct.selling_price -
                                viewingProduct.buying_price) /
                                viewingProduct.selling_price) *
                              100
                            ).toFixed(1)}
                            % margin
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-amber-600">
                            Per unit profit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            Current Stock
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {viewingProduct.quantity_in_stock}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Units available
                        </p>
                      </div>

                      <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl border-2 border-orange-300 dark:border-orange-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <h4 className="font-semibold text-orange-700 dark:text-orange-300">
                            Reorder Level
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {viewingProduct.reorder_level}
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          Minimum stock alert
                        </p>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300">
                      {viewingProduct.quantity_in_stock <=
                      viewingProduct.reorder_level ? (
                        <div className="flex items-center space-x-3 text-red-700">
                          <AlertCircle className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Low Stock Alert!</p>
                            <p className="text-sm text-red-600">
                              This product needs to be restocked soon.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-emerald-700">
                          <Package className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Stock Level: Good</p>
                            <p className="text-sm text-emerald-600">
                              Product is well stocked.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-600">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          Product Information
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Created:
                          </p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatDate(viewingProduct.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Last Updated:
                          </p>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {formatDate(viewingProduct.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => {
                          handleCloseView();
                          handleEdit(viewingProduct);
                        }}
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg hover:shadow-xl border-2 border-amber-400 hover:scale-105 active:scale-95"
                      >
                        <Edit2 className="w-5 h-5" />
                        <span>Edit Product</span>
                      </button>
                      <button
                        onClick={handleCloseView}
                        className="flex items-center justify-center space-x-2 bg-white text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors border-2 border-slate-200 hover:border-slate-300 hover:scale-105 active:scale-95"
                      >
                        <X className="w-5 h-5" />
                        <span>Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}
      {showReceive && (
        <ReceiveStockModal
          onClose={() => setShowReceive(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
      {showAudit && <StockAuditTrail onClose={() => setShowAudit(false)} />}
    </div>
  );
}
