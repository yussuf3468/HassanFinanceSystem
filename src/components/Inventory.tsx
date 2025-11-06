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
      <div className="text-center py-12 text-white">Loading inventory...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Inventory Management
          </h2>
          <p className="text-slate-300 mt-0.5 text-xs sm:text-sm">
            Manage your bookstore products
          </p>
        </div>

        {/* Mobile First: Stack all buttons vertically on mobile, then horizontal on larger screens */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-5 py-3 rounded-xl hover:from-emerald-500 hover:to-green-500 transition-all shadow-xl hover:shadow-2xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1"
            title="Record a new stock receipt"
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Alaab timid - Receive Stock</span>
          </button>
          <button
            onClick={() => setShowAudit(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-xl hover:shadow-2xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1"
            title="View stock movement history"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Raadraac</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-3 rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all shadow-xl hover:shadow-2xl hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto sm:flex-1"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Qiimaha Iibsiga - Buying Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Qiimaha Iibka - Selling Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No products yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => {
                  const isLowStock =
                    product.quantity_in_stock <= product.reorder_level;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <button
                              onClick={() => handleView(product)}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                              <OptimizedImage
                                src={product.image_url}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg"
                                preset="thumbnail"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleView(product)}
                              className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
                            >
                              <Package className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                          <div>
                            <button
                              onClick={() => handleView(product)}
                              className="font-medium text-white hover:text-purple-400 transition-colors text-left"
                            >
                              {product.name}
                            </button>
                            <p className="text-sm text-slate-400">
                              {product.product_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-semibold">
                        KES {product.buying_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-white font-bold">
                        KES {product.selling_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              isLowStock
                                ? "bg-red-600/20 text-red-400 border border-red-500/30"
                                : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
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
                            className="p-2 text-emerald-400 hover:bg-emerald-600/20 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-rose-400 hover:bg-rose-600/20 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
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
        {sortedProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No products found. Add your first product to get started!</p>
          </div>
        ) : (
          sortedProducts.map((product) => {
            const isLowStock =
              product.quantity_in_stock <= product.reorder_level;
            return (
              <div
                key={product.id}
                className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-4 hover:bg-white/15 transition-all"
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
                        className="w-16 h-16 object-cover rounded-xl border-2 border-white/20"
                        preset="thumbnail"
                      />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleView(product)}
                      className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
                    >
                      <Package className="w-7 h-7 text-slate-400" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleView(product)}
                          className="font-semibold text-white hover:text-purple-400 transition-colors text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-sm text-slate-400">
                          ID: {product.product_id}
                        </p>
                        <p className="text-sm text-slate-300">
                          {product.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => handleView(product)}
                          className="p-2 text-emerald-400 hover:bg-emerald-600/20 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-rose-400 hover:bg-rose-600/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400">Buy Price</p>
                        <p className="font-bold text-white">
                          KES {product.buying_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-white sm:text-slate-500">
                          Sell Price
                        </p>
                        <p className="font-medium text-white sm:text-slate-300">
                          KES {product.selling_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-white sm:text-slate-500">Stock</p>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock
                                ? "bg-red-600/20 text-red-400 border border-red-500/30"
                                : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
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

      {/* Product View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-4 px-4 flex justify-center">
            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl max-w-4xl w-full h-fit my-4 max-h-[calc(100vh-2rem)] overflow-y-auto border border-white/20">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {viewingProduct.name}
                    </h3>
                    <p className="text-slate-300 mt-1">
                      Product ID: {viewingProduct.product_id}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseView}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-300" />
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
                          className="w-full h-80 lg:h-96 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                          preset="large"
                        />
                      ) : (
                        <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-white/10 to-white/20 rounded-xl flex items-center justify-center border border-white/20">
                          <div className="text-center">
                            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-300 font-medium">
                              No Image Available
                            </p>
                            <p className="text-slate-400 text-sm">
                              Upload an image to enhance product display
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Category Badge */}
                    <div>
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        <Tag className="w-4 h-4 mr-2" />
                        {viewingProduct.category}
                      </span>
                    </div>

                    {/* Product Description */}
                    {viewingProduct.description && (
                      <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/20">
                        <h4 className="font-semibold text-white mb-2 flex items-center">
                          <Eye className="w-4 h-4 mr-2 text-slate-300" />
                          Product Description
                        </h4>
                        <p className="text-slate-300 leading-relaxed">
                          {viewingProduct.description}
                        </p>
                      </div>
                    )}

                    {/* Price Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-400" />
                          <h4 className="font-semibold text-green-300">
                            Buying Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          KES {viewingProduct.buying_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-300 mt-1">
                          Cost per unit
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 p-4 rounded-xl border border-blue-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <h4 className="font-semibold text-blue-300">
                            Selling Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                          KES {viewingProduct.selling_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-300 mt-1">
                          Price per unit
                        </p>
                      </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-purple-300 mb-1">
                            Profit Margin
                          </h4>
                          <p className="text-2xl font-bold text-purple-400">
                            KES{" "}
                            {(
                              viewingProduct.selling_price -
                              viewingProduct.buying_price
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm text-purple-300">
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
                          <p className="text-sm text-purple-300">
                            Per unit profit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-5 h-5 text-slate-300" />
                          <h4 className="font-semibold text-white">
                            Current Stock
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {viewingProduct.quantity_in_stock}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">
                          Units available
                        </p>
                      </div>

                      <div className="bg-orange-500/20 p-4 rounded-xl border border-orange-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-orange-400" />
                          <h4 className="font-semibold text-orange-300">
                            Reorder Level
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-orange-400">
                          {viewingProduct.reorder_level}
                        </p>
                        <p className="text-sm text-orange-300 mt-1">
                          Minimum stock alert
                        </p>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-white/20">
                      {viewingProduct.quantity_in_stock <=
                      viewingProduct.reorder_level ? (
                        <div className="flex items-center space-x-3 text-red-400">
                          <AlertCircle className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Low Stock Alert!</p>
                            <p className="text-sm text-red-300">
                              This product needs to be restocked soon.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-green-400">
                          <Package className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Stock Level: Good</p>
                            <p className="text-sm text-green-300">
                              Product is well stocked.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-white/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-slate-300" />
                        <h4 className="font-semibold text-white">
                          Product Information
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-300">Created:</p>
                          <p className="font-medium text-white">
                            {formatDate(viewingProduct.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-300">Last Updated:</p>
                          <p className="font-medium text-white">
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
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Edit2 className="w-5 h-5" />
                        <span>Edit Product</span>
                      </button>
                      <button
                        onClick={handleCloseView}
                        className="flex items-center justify-center space-x-2 bg-white/10 text-slate-300 px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/20"
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
