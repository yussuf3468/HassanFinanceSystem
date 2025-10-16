import { useState, useEffect, useRef } from "react";
import { X, Search, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = ["Cash", "Mpesa", "Card", "Bank Transfer"];
const staffMembers = ["Yussuf", "Khaled", "Zakaria"];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = products.find((p) => p.id === formData.product_id);

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setFormData({ ...formData, product_id: product.id });
    setSearchTerm(product.name);
    setShowDropdown(false);
  };

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto border border-white/20 animate-scaleIn">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white">
                💰 Diiwaan Gali Iib Cusub - Record New Sale
              </h3>
              <p className="text-purple-100 text-sm font-medium">
                Si sahlan oo dhaqso ah u diiwaan gali iibka
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 hover:scale-110 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 bg-white/5 backdrop-blur-xl"
        >
          {/* Enhanced Product Selection with Search */}
          <div className="space-y-3">
            <label className="block text-base font-bold text-white">
              📦 Dooro Alaabta - Select Product *
            </label>
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) {
                      setFormData({ ...formData, product_id: "" });
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="🔍 Raadi alaab - Search for products..."
                  className="w-full pl-12 pr-4 py-4 text-lg bg-white/10 border-2 border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/25 focus:border-purple-500 transition-all duration-300 shadow-sm text-white placeholder-slate-400"
                />
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && searchTerm && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-slate-900 border-2 border-white/20 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 border-b border-white/10 last:border-b-0 group"
                    >
                      <div className="flex items-center space-x-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                            {product.name}
                          </p>
                          <p className="text-sm text-slate-300 truncate">
                            ID: {product.product_id} • Stock:{" "}
                            {product.quantity_in_stock} •{" "}
                            <span className="text-purple-300 font-semibold">
                              KES {product.selling_price.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length > 10 && (
                    <div className="px-4 py-2 text-sm text-slate-400 bg-white/5 border-t border-white/10">
                      Showing first 10 of {filteredProducts.length} results
                    </div>
                  )}
                </div>
              )}

              {/* No results message */}
              {showDropdown && searchTerm && filteredProducts.length === 0 && (
                <div className="absolute z-10 w-full mt-2 bg-slate-900 border-2 border-white/20 rounded-xl shadow-xl p-4 text-center">
                  <p className="text-slate-400">
                    No products found matching "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl p-6 border-2 border-purple-500/30 shadow-lg animate-fadeIn backdrop-blur-xl">
              <div className="flex items-start space-x-4">
                {selectedProduct.image_url && (
                  <div className="relative">
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-24 h-24 object-cover rounded-xl shadow-lg border-2 border-white/20"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <h4 className="text-xl font-bold text-white">
                    {selectedProduct.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3">
                      <span className="text-slate-300 text-sm font-medium">
                        💰 Qiimaha mid - Price per item
                      </span>
                      <div className="text-lg font-black text-purple-300">
                        KES {selectedProduct.selling_price.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3">
                      <span className="text-slate-300 text-sm font-medium">
                        📦 Alaab Jira - Available Stock
                      </span>
                      <div className="text-lg font-black text-blue-300">
                        {selectedProduct.quantity_in_stock} cutub
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discount Section */}
          <div className="bg-white/10 backdrop-blur-xl rounded-lg p-3 sm:p-4 border border-white/20">
            <h4 className="font-medium text-white mb-3">Discount (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                >
                  <option value="none" className="bg-slate-900 text-white">
                    No Discount
                  </option>
                  <option
                    value="percentage"
                    className="bg-slate-900 text-white"
                  >
                    Percentage (%)
                  </option>
                  <option value="amount" className="bg-slate-900 text-white">
                    Fixed Amount (KES)
                  </option>
                </select>
              </div>

              {formData.discount_type !== "none" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                    placeholder={
                      formData.discount_type === "percentage" ? "10" : "100"
                    }
                  />
                </div>
              )}

              {selectedProduct && formData.quantity_sold && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Original Total:</span>
                    <span className="font-medium text-white">
                      KES {originalTotal.toLocaleString()}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount:</span>
                      <span className="font-medium">
                        -KES {discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/20 pt-2 font-bold text-purple-400">
                    <span>Final Total:</span>
                    <span>KES {finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
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
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-400"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Method *
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) =>
                  setFormData({ ...formData, payment_method: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              >
                {paymentMethods.map((method) => (
                  <option
                    key={method}
                    value={method}
                    className="bg-slate-900 text-white"
                  >
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sold By (Staff Name) *
              </label>
              <select
                required
                value={formData.sold_by}
                onChange={(e) =>
                  setFormData({ ...formData, sold_by: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
              >
                <option value="" className="bg-slate-900 text-white">
                  -- Select Staff Member --
                </option>
                {staffMembers.map((staff) => (
                  <option
                    key={staff}
                    value={staff}
                    className="bg-slate-900 text-white"
                  >
                    {staff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && formData.quantity_sold && (
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-lg p-4 border border-purple-500/30">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-300">Total Sale:</span>
                  <span className="ml-2 font-bold text-purple-300">
                    KES{" "}
                    {(
                      selectedProduct.selling_price *
                      parseInt(formData.quantity_sold)
                    ).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300">Profit:</span>
                  <span className="ml-2 font-bold text-green-400">
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

          <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 font-medium"
            >
              {submitting ? "Recording Sale..." : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
