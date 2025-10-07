import { useEffect, useState } from "react";
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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import ProductForm from "./ProductForm";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const deleteMessage = `Haqii inaad doonaysid inaad tirtirto "${product.name}"?\n\nTani waxay u baahan tahay:\n1. Tirtirka dhammaan iibkii (sales) ee ku saabsan alaabtan\n2. Tirtirka alaabta (product) guud ahaan\n\nAre you sure you want to delete "${product.name}"?\n\nThis will:\n1. Delete ALL sales records for this product\n2. Delete the product completely`;

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

      // Then delete the product
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (productError) {
        console.error("Error deleting product:", productError);
        alert("Failed to delete product. Please try again.");
        return;
      }

      alert(`✅ Successfully deleted "${product.name}" and all related sales!`);
      await loadProducts();
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
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleFormSuccess() {
    handleCloseForm();
    await loadProducts();
  }

  if (loading) {
    return <div className="text-center py-12">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Inventory Management
          </h2>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            Manage your bookstore products
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Qiimaha Iibsiga - Buying Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Qiimaha Iibka - Selling Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    No products yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock =
                    product.quantity_in_stock <= product.reorder_level;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <button
                              onClick={() => handleView(product)}
                              className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleView(product)}
                              className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-300 transition-colors"
                            >
                              <span className="text-slate-400 text-xs">
                                No Image
                              </span>
                            </button>
                          )}
                          <div>
                            <button
                              onClick={() => handleView(product)}
                              className="font-medium text-slate-800 hover:text-blue-600 transition-colors text-left"
                            >
                              {product.name}
                            </button>
                            <p className="text-sm text-slate-500">
                              {product.product_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        KES {product.buying_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        KES {product.selling_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              isLowStock
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {product.quantity_in_stock}
                          </span>
                          {isLowStock && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        {products.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No products found. Add your first product to get started!</p>
          </div>
        ) : (
          products.map((product) => {
            const isLowStock =
              product.quantity_in_stock <= product.reorder_level;
            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-4"
              >
                <div className="flex items-start space-x-4">
                  {product.image_url && (
                    <button
                      onClick={() => handleView(product)}
                      className="flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => handleView(product)}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                        >
                          {product.name}
                        </button>
                        <p className="text-sm text-slate-500">
                          ID: {product.product_id}
                        </p>
                        <p className="text-sm text-slate-600">
                          {product.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => handleView(product)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-slate-500">Buy Price</p>
                        <p className="font-medium">
                          KES {product.buying_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Sell Price</p>
                        <p className="font-medium">
                          KES {product.selling_price}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Stock</p>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-screen py-4 px-4 flex justify-center">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-fit my-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {viewingProduct.name}
                    </h3>
                    <p className="text-slate-600 mt-1">
                      Product ID: {viewingProduct.product_id}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseView}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
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
                        <img
                          src={viewingProduct.image_url}
                          alt={viewingProduct.name}
                          className="w-full h-80 lg:h-96 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                        />
                      ) : (
                        <div className="w-full h-80 lg:h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                          <div className="text-center">
                            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">
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
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                        <Tag className="w-4 h-4 mr-2" />
                        {viewingProduct.category}
                      </span>
                    </div>

                    {/* Price Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-green-800">
                            Buying Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          KES {viewingProduct.buying_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Cost per unit
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-800">
                            Selling Price
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          KES {viewingProduct.selling_price.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Price per unit
                        </p>
                      </div>
                    </div>

                    {/* Profit Margin */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-purple-800 mb-1">
                            Profit Margin
                          </h4>
                          <p className="text-2xl font-bold text-purple-700">
                            KES{" "}
                            {(
                              viewingProduct.selling_price -
                              viewingProduct.buying_price
                            ).toLocaleString()}
                          </p>
                          <p className="text-sm text-purple-600">
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
                          <p className="text-sm text-purple-600">
                            Per unit profit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-5 h-5 text-slate-600" />
                          <h4 className="font-semibold text-slate-800">
                            Current Stock
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-slate-700">
                          {viewingProduct.quantity_in_stock}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          Units available
                        </p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-orange-800">
                            Reorder Level
                          </h4>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">
                          {viewingProduct.reorder_level}
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          Minimum stock alert
                        </p>
                      </div>
                    </div>

                    {/* Stock Status */}
                    <div className="p-4 rounded-xl border-2 border-dashed">
                      {viewingProduct.quantity_in_stock <=
                      viewingProduct.reorder_level ? (
                        <div className="flex items-center space-x-3 text-red-700">
                          <AlertCircle className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Low Stock Alert!</p>
                            <p className="text-sm">
                              This product needs to be restocked soon.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 text-green-700">
                          <Package className="w-6 h-6" />
                          <div>
                            <p className="font-semibold">Stock Level: Good</p>
                            <p className="text-sm">Product is well stocked.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <h4 className="font-semibold text-slate-800">
                          Product Information
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Created:</p>
                          <p className="font-medium text-slate-800">
                            {new Date(
                              viewingProduct.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Last Updated:</p>
                          <p className="font-medium text-slate-800">
                            {new Date(
                              viewingProduct.updated_at
                            ).toLocaleDateString()}
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
                        className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Edit2 className="w-5 h-5" />
                        <span>Edit Product</span>
                      </button>
                      <button
                        onClick={handleCloseView}
                        className="flex items-center justify-center space-x-2 bg-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-300 transition-colors"
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
    </div>
  );
}
