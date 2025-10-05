import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, AlertCircle, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import ProductForm from './ProductForm';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
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
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">Manage your bookstore products</p>
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
                  Buying Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Selling Price
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products yet. Click "Add Product" to get started.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.quantity_in_stock <= product.reorder_level;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                              <span className="text-slate-400 text-xs">No Image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{product.name}</p>
                            <p className="text-sm text-slate-500">{product.product_id}</p>
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
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
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
            const isLowStock = product.quantity_in_stock <= product.reorder_level;
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                <div className="flex items-start space-x-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate">{product.name}</h3>
                        <p className="text-sm text-slate-500">ID: {product.product_id}</p>
                        <p className="text-sm text-slate-600">{product.category}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
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
                        <p className="font-medium">KES {product.buying_price}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Sell Price</p>
                        <p className="font-medium">KES {product.selling_price}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Stock</p>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isLowStock
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
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
