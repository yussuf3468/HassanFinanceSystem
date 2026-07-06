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
  LayoutGrid,
  List,
  Crown,
} from "lucide-react";
import { useProducts, useStoreSubscription } from "../hooks/useSupabaseQuery";
import { getPlan } from "../config/subscriptionPlans";
import { deleteProductWithRelations } from "../api";
import type { Product } from "../types";
import ProductForm from "./ProductForm";
import ReceiveStockModal from "./ReceiveStockModal";
import StockAuditTrail from "./StockAuditTrail";
import OptimizedImage from "./OptimizedImage";
import { formatDate } from "../utils/dateFormatter";

export default function Inventory() {
  const { data: products = [], isLoading: loading, refetch } = useProducts();
  const { data: subscription } = useStoreSubscription();
  const plan = getPlan(subscription?.plan);
  const atPlanLimit =
    plan.productLimit !== null && products.length >= plan.productLimit;
  const [showForm, setShowForm] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // View mode: "list" (table on desktop, cards on mobile) or "grid" (visual cards)
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("inventory_viewMode");
    return saved === "grid" ? "grid" : "list";
  });

  useEffect(() => {
    localStorage.setItem("inventory_viewMode", viewMode);
  }, [viewMode]);

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

    const deleteMessage = `Are you sure you want to delete "${product.name}"?\n\nThis will:\n1. Delete ALL sales records for this product\n2. Delete ALL order items for this product\n3. Delete the product completely\n\nThis action cannot be undone!`;

    if (!confirm(deleteMessage)) return;

    try {
      await deleteProductWithRelations(id);

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
            Manage your products, stock and pricing
          </p>
        </div>

        {/* Toolbar: one primary action (Add Product), two secondary. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-2.5">
          <button
            onClick={() => setShowForm(true)}
            disabled={atPlanLimit}
            title={
              atPlanLimit
                ? `Your ${plan.name} plan is limited to ${plan.productLimit} products`
                : "Add a new product"
            }
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
          <button
            onClick={() => setShowReceive(true)}
            title="Record a new stock receipt"
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors w-full sm:w-auto"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Receive Stock</span>
          </button>
          <button
            onClick={() => setShowAudit(true)}
            title="View stock movement history"
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-colors w-full sm:w-auto"
          >
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Stock History</span>
          </button>
        </div>

        {/* Plan limit banner */}
        {atPlanLimit && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
            <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
              <Crown className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                You've reached the {plan.name} plan limit of{" "}
                <strong>{plan.productLimit} products</strong>. Upgrade your
                plan to add more.
              </span>
            </div>
            <button
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("app:navigate-tab", {
                    detail: "subscription",
                  }),
                )
              }
              className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              View plans
            </button>
          </div>
        )}

        {/* View toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sortedProducts.length} product{sortedProducts.length !== 1 ? "s" : ""}
          </p>
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View (list mode) */}
      <div className={`${viewMode === "list" ? "hidden lg:block" : "hidden"} bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-100 dark:border-slate-700 overflow-hidden transition-colors duration-200`}>
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
                  Buying Price
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Selling Price
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
                                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
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

      {/* Mobile Card View (list mode) */}
      <div className={viewMode === "list" ? "lg:hidden space-y-4" : "hidden"}>
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">
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
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border-2 border-slate-100 dark:border-slate-700 p-4 hover:border-amber-300 dark:hover:border-amber-600 transition-all hover:shadow-lg"
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
                        className="w-16 h-16 object-cover rounded-2xl border-2 border-amber-300/70 shadow-sm"
                        preset="thumbnail"
                      />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleView(product)}
                      className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border-2 border-slate-200 dark:border-slate-600"
                    >
                      <Package className="w-7 h-7 text-slate-400" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleView(product)}
                          className="font-semibold text-slate-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          ID: {product.product_id}
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
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
                        <p className="text-slate-500 dark:text-slate-400">Buy Price</p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          KES {product.buying_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Sell Price</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          KES {product.selling_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Stock</p>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock
                                ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {paginatedProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-600 dark:text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p>No products found. Add your first product to get started!</p>
            </div>
          ) : (
            paginatedProducts.map((product) => {
              const isLowStock =
                product.quantity_in_stock <= product.reorder_level;
              const outOfStock = product.quantity_in_stock <= 0;
              return (
                <div
                  key={product.id}
                  className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 border-slate-100 dark:border-slate-700 overflow-hidden hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all"
                >
                  {/* Image — object-contain on a neutral panel keeps every
                      product photo fully visible and uniform across the row */}
                  <button
                    onClick={() => handleView(product)}
                    className="relative block w-full aspect-square bg-white dark:bg-slate-900 overflow-hidden"
                  >
                    {product.image_url ? (
                      <OptimizedImage
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                        fallbackClassName="w-full h-full"
                        preset="product"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                        <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {/* Stock badge — frosted pill stays legible over any image */}
                    {outOfStock ? (
                      <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        Out of stock
                      </span>
                    ) : (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isLowStock ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        {product.quantity_in_stock} in stock
                      </span>
                    )}
                  </button>

                  {/* Body */}
                  <div className="p-3">
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide truncate">
                      {product.category}
                    </p>
                    <button
                      onClick={() => handleView(product)}
                      className="mt-0.5 block w-full text-left font-semibold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5em] hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      {product.name}
                    </button>
                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">
                        KES {product.selling_price.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Buy: {product.buying_price.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2">
                      <button
                        onClick={() => handleView(product)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {sortedProducts.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-sm rounded-xl">
          <div className="text-sm text-slate-700 dark:text-slate-300">
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
              className="px-3 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                className="px-4 py-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm hover:bg-amber-50 dark:hover:bg-slate-600 hover:border-amber-300 dark:hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                            Profit Margin
                          </h4>
                          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                            KES{" "}
                            {(
                              viewingProduct.selling_price -
                              viewingProduct.buying_price
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
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
                          <p className="text-sm text-amber-600 dark:text-amber-400">
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
                    <div className="p-4 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700">
                      {viewingProduct.quantity_in_stock <=
                      viewingProduct.reorder_level ? (
                        <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
                          <AlertCircle className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Low Stock Alert!</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              This product needs to be restocked soon.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-emerald-700 dark:text-emerald-400">
                          <Package className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Stock Level: Good</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
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
                        className="flex items-center justify-center space-x-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:scale-105 active:scale-95"
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
