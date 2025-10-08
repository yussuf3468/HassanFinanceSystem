import { useState, useCallback, memo } from "react";
import {
  X,
  CreditCard,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  MessageSquare,
  CheckCircle,
  Loader,
} from "lucide-react";
import { toast } from "react-toastify";
import { supabase } from "../lib/supabase";
import { useCart } from "../contexts/CartContext";
import DeliveryCalculator from "./DeliveryCalculator";
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
        toast.error("Please enter your name", {
          className:
            "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
          progressClassName: "!bg-red-500",
        });
        return false;
      }
      if (!formData.phone_number.trim()) {
        toast.error("Please enter your phone number", {
          className:
            "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
          progressClassName: "!bg-red-500",
        });
        return false;
      }
      if (!formData.delivery_address.trim()) {
        toast.error("Please enter your delivery address", {
          className:
            "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
          progressClassName: "!bg-red-500",
        });
        return false;
      }
      if (formData.phone_number.length < 10) {
        toast.error("Please enter a valid phone number", {
          className:
            "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
          progressClassName: "!bg-red-500",
        });
        return false;
      }
      return true;
    }, [formData]);

    const handleSubmit = useCallback(
      async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (cart.items.length === 0) {
          toast.error("Your cart is empty", {
            className:
              "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
            progressClassName: "!bg-red-500",
          });
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

          toast.success(
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-green-900 text-sm">
                  Order Placed Successfully!
                </p>
                <p className="text-xs text-green-700">
                  Order #{order.order_number}
                </p>
              </div>
            </div>,
            {
              position: "top-center",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              className:
                "!bg-green-50 !text-green-900 !border !border-green-200 !rounded-lg !shadow-lg !min-h-12",
              progressClassName: "!bg-green-500",
            }
          );

          onOrderComplete?.(order);
          onClose();
        } catch (error) {
          console.error("Checkout error:", error);
          toast.error("Failed to place order. Please try again.", {
            className:
              "!bg-white !text-slate-900 !border !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
            progressClassName: "!bg-red-500",
          });
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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
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
            <p className="text-blue-100 mt-2">Complete your order</p>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Order Summary */}
            <div className="p-6 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-600">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-900">
                      KES{" "}
                      {(
                        item.product.selling_price * item.quantity
                      ).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">
                    KES {subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Delivery Fee:</span>
                  <span className="font-medium">
                    {deliveryFee === 0
                      ? "FREE"
                      : `KES ${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-blue-600">
                    KES {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Customer Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customer_name}
                      onChange={(e) =>
                        handleInputChange("customer_name", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
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
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+254 700 000 000"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <Truck className="w-5 h-5" />
                  <span>Delivery Information</span>
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Delivery Address *
                  </label>
                  <DeliveryAddressSelector
                    value={formData.delivery_address}
                    onChange={(address) =>
                      handleInputChange("delivery_address", address)
                    }
                    onDeliveryFeeChange={handleDeliveryFeeChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center space-x-2">
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
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 hover:border-slate-300"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Order Notes (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-3"
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
