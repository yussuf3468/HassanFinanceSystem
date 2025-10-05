import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ['Cash', 'Mpesa', 'Card', 'Bank Transfer'];

export default function SaleForm({ products, onClose, onSuccess }: SaleFormProps) {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity_sold: '',
    payment_method: 'Cash',
    sold_by: '',
    discount_type: 'none', // 'none', 'percentage', 'amount'
    discount_value: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === formData.product_id);
  
  // Calculate discount and final prices
  const calculatePrices = () => {
    if (!selectedProduct || !formData.quantity_sold) {
      return { originalTotal: 0, discountAmount: 0, finalTotal: 0, finalPrice: 0 };
    }

    const quantity = parseInt(formData.quantity_sold);
    const originalTotal = selectedProduct.selling_price * quantity;
    let discountAmount = 0;

    if (formData.discount_type === 'percentage' && formData.discount_value) {
      const percentage = parseFloat(formData.discount_value);
      discountAmount = (originalTotal * percentage) / 100;
    } else if (formData.discount_type === 'amount' && formData.discount_value) {
      discountAmount = parseFloat(formData.discount_value);
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);
    const finalPrice = finalTotal / quantity;

    return { originalTotal, discountAmount, finalTotal, finalPrice };
  };

  const { originalTotal, discountAmount, finalTotal, finalPrice } = calculatePrices();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const quantitySold = parseInt(formData.quantity_sold);

    if (quantitySold > selectedProduct.quantity_in_stock) {
      alert('Insufficient stock. Available: ' + selectedProduct.quantity_in_stock);
      return;
    }

    setSubmitting(true);

    try {
      const discountPercentage = formData.discount_type === 'percentage' ? parseFloat(formData.discount_value || '0') : 0;
      const profit = (finalPrice - selectedProduct.buying_price) * quantitySold;

      const { error: saleError } = await supabase.from('sales').insert({
        product_id: formData.product_id,
        quantity_sold: quantitySold,
        selling_price: selectedProduct.selling_price,
        buying_price: selectedProduct.buying_price,
        total_sale: finalTotal,
        profit: profit,
        payment_method: formData.payment_method,
        sold_by: formData.sold_by,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
        original_price: selectedProduct.selling_price,
        final_price: finalPrice,
      });

      if (saleError) throw saleError;

      const newStock = selectedProduct.quantity_in_stock - quantitySold;
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity_in_stock: newStock })
        .eq('id', formData.product_id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-800">Record New Sale</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Product *
            </label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">-- Select a product --</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.product_id}) - Stock: {product.quantity_in_stock}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start space-x-4">
                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-slate-800">{selectedProduct.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Selling Price:</span>
                      <span className="ml-2 font-medium text-slate-800">
                        KES {selectedProduct.selling_price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Available Stock:</span>
                      <span className="ml-2 font-medium text-slate-800">
                        {selectedProduct.quantity_in_stock}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discount Section */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-slate-800 mb-3">Discount (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value, discount_value: '' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (KES)</option>
                </select>
              </div>

              {formData.discount_type !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                  />
                </div>
              )}

              {selectedProduct && formData.quantity_sold && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Original Total:</span>
                    <span className="font-medium">KES {originalTotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span className="font-medium">-KES {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 font-bold text-green-600">
                    <span>Final Total:</span>
                    <span>KES {finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity Sold *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedProduct?.quantity_in_stock || undefined}
                value={formData.quantity_sold}
                onChange={(e) => setFormData({ ...formData, quantity_sold: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Payment Method *
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sold By (Staff Name) *
              </label>
              <input
                type="text"
                required
                value={formData.sold_by}
                onChange={(e) => setFormData({ ...formData, sold_by: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter staff name"
              />
            </div>
          </div>

          {selectedProduct && formData.quantity_sold && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total Sale:</span>
                  <span className="ml-2 font-bold text-green-700">
                    KES {(selectedProduct.selling_price * parseInt(formData.quantity_sold)).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Profit:</span>
                  <span className="ml-2 font-bold text-green-700">
                    KES {((selectedProduct.selling_price - selectedProduct.buying_price) * parseInt(formData.quantity_sold)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
