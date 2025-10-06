import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ["Cash", "Mpesa", "Card", "Bank Transfer"];
const staffMembers = ["Zakaria", "Khaled"];

export default function SaleForm({
  products,
  onClose,
  onSuccess,
}: SaleFormProps) {
  const [formData, setFormData] = useState({
    product_id: "",
    quantity_sold: "",
    payment_method: "Cash",
    sold_by: "",
    discount_type: "none", // 'none', 'percentage', 'amount'
    discount_value: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  // Calculate discount and final prices
  const calculatePrices = () => {
    if (!selectedProduct || !formData.quantity_sold) {
      return {
        originalTotal: 0,
        discountAmount: 0,
        finalTotal: 0,
        finalPrice: 0,
      };
    }

    const quantity = parseInt(formData.quantity_sold);
    const originalTotal = selectedProduct.selling_price * quantity;
    let discountAmount = 0;

    if (formData.discount_type === "percentage" && formData.discount_value) {
      const percentage = parseFloat(formData.discount_value);
      discountAmount = (originalTotal * percentage) / 100;
    } else if (formData.discount_type === "amount" && formData.discount_value) {
      discountAmount = parseFloat(formData.discount_value);
    }

    const finalTotal = Math.max(0, originalTotal - discountAmount);
    const finalPrice = finalTotal / quantity;

    return { originalTotal, discountAmount, finalTotal, finalPrice };
  };

  const { originalTotal, discountAmount, finalTotal, finalPrice } =
    calculatePrices();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const quantitySold = parseInt(formData.quantity_sold);

    if (quantitySold > selectedProduct.quantity_in_stock) {
      alert(
        "Insufficient stock. Available: " + selectedProduct.quantity_in_stock
      );
      return;
    }

    setSubmitting(true);

    try {
      const discountPercentage =
        formData.discount_type === "percentage"
          ? parseFloat(formData.discount_value || "0")
          : 0;
      const profit = (finalPrice - selectedProduct.buying_price) * quantitySold;

      const { error: saleError } = await supabase.from("sales").insert({
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
        .from("products")
        .update({ quantity_in_stock: newStock })
        .eq("id", formData.product_id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (error) {
      console.error("Error recording sale:", error);
      alert("Failed to record sale");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-white/20 animate-scaleIn">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-emerald-500/50 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white">
                💰 Diiwaan Gali Iib Cusub - Record New Sale
              </h3>
              <p className="text-green-100 text-sm font-medium">
                Si sahlan oo dhaqso ah u diiwaan gali iibka
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Enhanced Product Selection */}
          <div className="space-y-3">
            <label className="block text-base font-bold text-slate-800">
              📦 Dooro Alaabta - Select Product *
            </label>
            <select
              required
              value={formData.product_id}
              onChange={(e) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
              className="w-full px-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-500/25 focus:border-green-500 transition-all duration-300 bg-white shadow-sm"
            >
              <option value="">🔍 Dooro alaab - Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.product_id}) - Stock:{" "}
                  {product.quantity_in_stock}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg animate-fadeIn">
              <div className="flex items-start space-x-4">
                {selectedProduct.image_url && (
                  <div className="relative">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-24 h-24 object-cover rounded-xl shadow-lg border-2 border-white"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <h4 className="text-xl font-bold text-slate-800">
                    {selectedProduct.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-slate-600 text-sm font-medium">
                        💰 Qiimaha mid - Price per item
                      </span>
                      <div className="text-lg font-black text-green-600">
                        KES {selectedProduct.selling_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="text-slate-600 text-sm font-medium">
                        📦 Alaab Jira - Available Stock
                      </span>
                      <div className="text-lg font-black text-blue-600">
                        {selectedProduct.quantity_in_stock} cutub
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discount Section */}
          <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <h4 className="font-medium text-slate-800 mb-3">
              Discount (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_type: e.target.value,
                      discount_value: "",
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="amount">Fixed Amount (KES)</option>
                </select>
              </div>

              {formData.discount_type !== "none" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={
                      formData.discount_type === "percentage" ? "0.01" : "1"
                    }
                    max={
                      formData.discount_type === "percentage"
                        ? "100"
                        : undefined
                    }
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.discount_type === "percentage" ? "10" : "100"
                    }
                  />
                </div>
              )}

              {selectedProduct && formData.quantity_sold && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Original Total:</span>
                    <span className="font-medium">
                      KES {originalTotal.toLocaleString()}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span className="font-medium">
                        -KES {discountAmount.toLocaleString()}
                      </span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
                onChange={(e) =>
                  setFormData({ ...formData, quantity_sold: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sold By (Staff Name) *
              </label>
              <select
                required
                value={formData.sold_by}
                onChange={(e) =>
                  setFormData({ ...formData, sold_by: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Select Staff Member --</option>
                {staffMembers.map((staff) => (
                  <option key={staff} value={staff}>
                    {staff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && formData.quantity_sold && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Total Sale:</span>
                  <span className="ml-2 font-bold text-green-700">
                    KES{" "}
                    {(
                      selectedProduct.selling_price *
                      parseInt(formData.quantity_sold)
                    ).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Profit:</span>
                  <span className="ml-2 font-bold text-green-700">
                    KES{" "}
                    {(
                      (selectedProduct.selling_price -
                        selectedProduct.buying_price) *
                      parseInt(formData.quantity_sold)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 font-medium"
            >
              {submitting ? "Recording Sale..." : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
