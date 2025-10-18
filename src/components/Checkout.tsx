import { useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  MessageSquare,
  CreditCard,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
import DeliveryAddressSelector from "./DeliveryAddressSelector";
import type { CheckoutForm } from "../types";
import OptimizedImage from "./OptimizedImage";

interface CheckoutProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function Checkout({ onBack, onSuccess }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [formData, setFormData] = useState<CheckoutForm>({
    customer_name: "",
    phone_number: "",
    delivery_address: "",
    email: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  const cart = useCart();

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = "Full name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (
      !/^(\+254|0)[17]\d{8}$/.test(formData.phone_number.replace(/\s/g, ""))
    ) {
      newErrors.phone_number = "Please enter a valid Kenyan phone number";
    }

    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = "Delivery address is required";
    }

    // Email validation (optional)
    if (
      formData.email &&
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (cart.items.length === 0) return;

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: formData.customer_name,
          customer_email: formData.email || null,
          customer_phone: formData.phone_number,
          delivery_address: formData.delivery_address,
          delivery_fee: deliveryFee,
          subtotal: cart.totalPrice,
          total_amount: cart.totalPrice + deliveryFee,
          status: "pending",
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        total_price: item.product.selling_price * item.quantity,
        product_name: item.product.name,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cart.items) {
        const { error: stockError } = await supabase
          .from("products")
          .update({
            quantity_in_stock: item.product.quantity_in_stock - item.quantity,
          })
          .eq("id", item.product.id);

        if (stockError) throw stockError;
      }

      setOrderNumber(order.order_number);
      setOrderPlaced(true);
      cart.clearCart();
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-slate-600 mb-4">
            Dalabka waa la diray - Your order has been received
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-600 mb-1">Order Number</p>
            <p className="text-xl font-bold text-blue-600">{orderNumber}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">Order Details</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Customer:</span>{" "}
                {formData.customer_name}
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                {formData.phone_number}
              </p>
              {formData.email && (
                <p>
                  <span className="font-medium">Email:</span> {formData.email}
                </p>
              )}
              <p>
                <span className="font-medium">Total:</span> KES{" "}
                {cart.totalPrice.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3 text-sm">
              📋 Next Steps / Tallaabada Xigta
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 flex-shrink-0 mt-0.5">✅</span>
                <p className="text-slate-700 font-medium">
                  Order confirmed and being processed
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-600 flex-shrink-0 mt-0.5">📞</span>
                <p className="text-slate-700 font-medium">
                  We'll call you to confirm delivery details
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-orange-600 flex-shrink-0 mt-0.5">🚚</span>
                <p className="text-slate-700 font-medium">
                  Expected delivery: 1-3 business days
                </p>
              </div>
              {formData.email && (
                <div className="flex items-start space-x-2">
                  <span className="text-purple-600 flex-shrink-0 mt-0.5">
                    📧
                  </span>
                  <p className="text-slate-700 font-medium">
                    Order updates will be sent to {formData.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onSuccess}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
            >
              Continue Shopping
            </button>

            {formData.email && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">
                  Want to track your orders easier?
                </p>
                <button
                  onClick={() => {
                    // TODO: Implement account creation
                    alert("Account creation feature coming soon!");
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Create an account with this email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Cart</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <CreditCard className="w-6 h-6" />
              <span>Checkout Details</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name / Magaca Buuxa
                </label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) =>
                    handleInputChange("customer_name", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.customer_name ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.customer_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.customer_name}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number / Lambarka Taleefanka
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleInputChange("phone_number", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone_number ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="+254 or 07xx xxx xxx"
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Delivery Address / Ciwaanka Gaarsiinta
                </label>
                <DeliveryAddressSelector
                  value={formData.delivery_address}
                  onChange={(address) =>
                    handleInputChange("delivery_address", address)
                  }
                  onDeliveryFeeChange={setDeliveryFee}
                  disabled={loading}
                />
                {errors.delivery_address && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.delivery_address}
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Email Address (Optional) / Cinwaanka Email-ka
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="your@email.com (for order updates)"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  We'll send order updates to this email if provided
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Special Instructions (Optional) / Tilmaamaha Gaarka ah
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Any special delivery instructions..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cart.items.length === 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>
                      Place Order - KES{" "}
                      {(cart.totalPrice + deliveryFee).toLocaleString()}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center space-x-3 bg-slate-50 rounded-lg p-3"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
                    {item.product.image_url ? (
                      <OptimizedImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        preset="small"
                      />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {item.quantity} × KES{" "}
                      {item.product.selling_price.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      KES{" "}
                      {(
                        item.product.selling_price * item.quantity
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  Subtotal ({cart.totalItems} items)
                </span>
                <span className="font-medium">
                  KES {cart.totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Delivery Fee</span>
                <span className="font-medium text-green-600">
                  {deliveryFee > 0 ? `KES ${deliveryFee}` : "FREE"}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">
                  KES {(cart.totalPrice + deliveryFee).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">
                Payment Information
              </h4>
              <p className="text-sm text-blue-700">
                💰 Cash on Delivery (COD) available
                <br />
                📱 M-Pesa payment on delivery
                <br />
                🚚 Free delivery within Nairobi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
