import { useState, useCallback, memo } from "react";
import {
  X,
  CreditCard,
  Truck,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
  Loader,
} from "lucide-react";
import compactToast from "../utils/compactToast";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
// import DeliveryCalculator from "./DeliveryCalculator";
import DeliveryAddressSelector from "./DeliveryAddressSelector";
import type { CheckoutForm } from "../types";
import type { Database } from "../lib/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderComplete?: (order: Order) => void;
}

const CheckoutModal = memo(
  ({ isOpen, onClose, onOrderComplete }: CheckoutModalProps) => {
    const cart = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [formData, setFormData] = useState<CheckoutForm>({
      customer_name: "",
      phone_number: "",
      delivery_address: "",
      email: "",
      notes: "",
    });
    const [paymentMethod, setPaymentMethod] = useState<
      "cash" | "mpesa" | "card" | "bank_transfer"
    >("mpesa");

    const handleDeliveryFeeChange = useCallback((fee: number) => {
      setDeliveryFee(fee);
    }, []);

    const handleInputChange = useCallback(
      (field: keyof CheckoutForm, value: string) => {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }));
      },
      []
    );

    const validateForm = useCallback(() => {
      if (!formData.customer_name.trim()) {
        compactToast.error("Please enter your name");
        return false;
      }
      if (!formData.phone_number.trim()) {
        compactToast.error("Please enter your phone number");
        return false;
      }
      if (!formData.delivery_address.trim()) {
        compactToast.error("Please enter your delivery address");
        return false;
      }
      if (formData.phone_number.length < 10) {
        compactToast.error("Please enter a valid phone number");
        return false;
      }
      return true;
    }, [formData]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (cart.items.length === 0) {
          compactToast.error("Your cart is empty");
          return;
        }

        setIsSubmitting(true);

        try {
          // Create the order
          const orderData = {
            customer_name: formData.customer_name,
            customer_email: formData.email || null,
            customer_phone: formData.phone_number,
            delivery_address: formData.delivery_address,
            delivery_fee: deliveryFee,
            subtotal: cart.totalPrice,
            total_amount: cart.totalPrice + deliveryFee,
            payment_method: paymentMethod,
            payment_status: "pending" as const,
            notes: formData.notes || null,
          };

          const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert([orderData])
            .select()
            .single();

          if (orderError) {
            console.error("Order creation error:", orderError);
            throw new Error("Failed to create order");
          }

          // Create order items
          const orderItems = cart.items.map((item) => ({
            order_id: order.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.selling_price,
            total_price: item.product.selling_price * item.quantity,
          }));

          const { error: itemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

          if (itemsError) {
            console.error("Order items creation error:", itemsError);
            throw new Error("Failed to create order items");
          }

          // Update product stock
          for (const item of cart.items) {
            const { error: stockError } = await supabase
              .from("products")
              .update({
                quantity_in_stock:
                  item.product.quantity_in_stock - item.quantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.product.id);

            if (stockError) {
              console.error("Stock update error:", stockError);
              // Don't throw here - order is already created
            }
          }

          // Success! Clear cart and show success message
          cart.clearCart();

          compactToast.orderSuccess(order.order_number);

          onOrderComplete?.(order);
          onClose();
        } catch (error) {
          console.error("Checkout error:", error);
          compactToast.error("Failed to place order. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        formData,
        paymentMethod,
        deliveryFee,
        cart,
        validateForm,
        onOrderComplete,
        onClose,
      ]
    );

    if (!isOpen) return null;

    const subtotal = cart.totalPrice;
    const total = subtotal + deliveryFee;

    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-6 h-6" />
                <h2 className="text-xl font-bold">Checkout</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-purple-100 mt-2">Complete your order</p>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Order Summary */}
            <div className="p-6 border-b border-white/30 bg-white/15 backdrop-blur-xl shadow-inner">
              <h3 className="font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-300">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-white">
                      KES{" "}
                      {(
                        item.product.selling_price * item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-white/20">
                  <span className="text-slate-300">Subtotal:</span>
                  <span className="font-medium text-white">
                    KES {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">Delivery Fee:</span>
                  <span className="font-medium text-white">
                    {deliveryFee === 0
                      ? "FREE"
                      : `KES ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-white/20">
                  <span className="text-white">Total:</span>
                  <span className="text-purple-400">
                    KES {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 bg-white/15 backdrop-blur-xl border-t border-white/30 shadow-inner"
            >
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Customer Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) =>
                        handleInputChange("customer_name", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/20 border border-white/40 rounded-lg text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300/60"
                      placeholder="Enter your full name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) =>
                          handleInputChange("phone_number", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/40 rounded-lg text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300/60"
                        placeholder="+254 700 000 000"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/40 rounded-lg text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300/60"
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Delivery Information</span>
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delivery Address *
                  </label>
                  <div className="bg-white/15 border border-white/30 rounded-lg p-1">
                    <DeliveryAddressSelector
                      value={formData.delivery_address}
                      onChange={(address) =>
                        handleInputChange("delivery_address", address)
                      }
                      onDeliveryFeeChange={handleDeliveryFeeChange}
                      disabled={isSubmitting}
                      dark
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-white mb-4 flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Method</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: "mpesa", label: "M-Pesa", emoji: "📱" },
                    { id: "cash", label: "Cash on Delivery", emoji: "💵" },
                    { id: "card", label: "Card Payment", emoji: "💳" },
                    {
                      id: "bank_transfer",
                      label: "Bank Transfer",
                      emoji: "🏦",
                    },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() =>
                        setPaymentMethod(method.id as typeof paymentMethod)
                      }
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        paymentMethod === method.id
                          ? "border-purple-300 bg-purple-500/30 text-white"
                          : "border-white/40 bg-white/15 text-white hover:bg-white/20"
                      }`}
                      disabled={isSubmitting}
                    >
                      <div className="text-2xl mb-1">{method.emoji}</div>
                      <div className="text-sm font-medium">{method.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Order Notes (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/40 rounded-lg text-white placeholder-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300/60 resize-none"
                    placeholder="Any special instructions or notes for your order..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.items.length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Place Order - KES {total.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
);

CheckoutModal.displayName = "CheckoutModal";

export default CheckoutModal;
