import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  MessageSquare,
  Smartphone,
  Truck,
  User,
  X,
} from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import DeliveryAddressSelector from "../../components/DeliveryAddressSelector";
import OrderConfirmationDialog from "../../components/ecommerce/OrderConfirmationDialog";
import { createOrderWithItemsAndStock } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import compactToast from "../../utils/compactToast";
import {
  notifyAdminNewOrder,
  requestNotificationPermission,
} from "../../utils/adminNotifications";
import { storeConfig } from "../config/store";
import { formatMoney } from "../lib/catalog";
import type { CheckoutForm } from "../../types";
import type { Database } from "../../lib/database.types";

type Order = Database["public"]["Tables"]["orders"]["Row"];

/* ═══════════════════════════════════════════════════════════════
   CHECKOUT — a calm, single-page takeover in the storefront
   design language. The order flow (Supabase order + items +
   stock decrement, admin notification, saved details) is the
   same proven logic as before, re-dressed.
   ═══════════════════════════════════════════════════════════════ */

interface SavedAddress {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  isDefault: boolean;
}

type PaymentMethod = "cash" | "mpesa" | "card" | "bank_transfer";

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  hint: string;
  icon: typeof Smartphone;
}> = [
  { value: "mpesa", label: "M-Pesa", hint: "Pay from your phone", icon: Smartphone },
  { value: "cash", label: "Cash on delivery", hint: "Pay when it arrives", icon: Banknote },
  { value: "card", label: "Card", hint: "Visa or Mastercard", icon: CreditCard },
  { value: "bank_transfer", label: "Bank transfer", hint: "Direct to our account", icon: Landmark },
];

const formatSavedAddress = (address: SavedAddress) =>
  [address.line1, address.line2, address.city].filter(Boolean).join(", ");

export default function Checkout({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string | null>(null);
  const [formData, setFormData] = useState<CheckoutForm>({
    customer_name: "",
    phone_number: "",
    delivery_address: "",
    email: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [saveInfo, setSaveInfo] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  // Load saved customer info and default address once on open.
  useEffect(() => {
    const userName = user?.user_metadata?.full_name || "";
    const userPhone = user?.user_metadata?.phone || "";
    const userEmail = user?.email || "";

    const addressesKey = user?.id ? `horumar.customer.${user.id}.addresses` : null;

    let defaultAddress = "";
    if (addressesKey) {
      try {
        const raw = localStorage.getItem(addressesKey);
        if (raw) {
          const addresses = JSON.parse(raw) as SavedAddress[];
          if (Array.isArray(addresses) && addresses.length > 0) {
            setSavedAddresses(addresses);
            const preferred =
              addresses.find((address) => address.isDefault) || addresses[0];
            defaultAddress = formatSavedAddress(preferred);
            setSelectedAddressLabel(preferred.label || null);
          }
        }
      } catch (error) {
        console.error("Failed to load saved addresses", error);
      }
    }

    try {
      const savedInfo = localStorage.getItem("customerInfo");
      if (savedInfo) {
        const parsed = JSON.parse(savedInfo);
        setFormData({
          customer_name: parsed.customer_name || userName,
          phone_number: parsed.phone_number || userPhone,
          delivery_address: parsed.delivery_address || defaultAddress,
          email: parsed.email || userEmail,
          notes: "",
        });
        if (parsed.payment_method) setPaymentMethod(parsed.payment_method);
        return;
      }
    } catch (error) {
      console.error("Failed to load saved customer info", error);
    }

    setFormData({
      customer_name: userName,
      phone_number: userPhone,
      delivery_address: defaultAddress,
      email: userEmail,
      notes: "",
    });
  }, [user]);

  // Ask for notification permission so admins hear about the order.
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  // Escape closes (unless mid-submit).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSubmitting, onClose]);

  const handleInputChange = useCallback(
    (field: keyof CheckoutForm, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (field === "delivery_address") {
        setSelectedAddressLabel(
          savedAddresses.find((a) => formatSavedAddress(a) === value)?.label ||
            null,
        );
      }
    },
    [savedAddresses],
  );

  const applySavedAddress = useCallback((address: SavedAddress) => {
    setSelectedAddressLabel(address.label || null);
    setFormData((prev) => ({
      ...prev,
      delivery_address: formatSavedAddress(address),
      phone_number: prev.phone_number || address.phone,
    }));
  }, []);

  function validateForm() {
    if (!formData.customer_name.trim()) {
      compactToast.error("Please enter your name");
      return false;
    }
    if (!formData.phone_number.trim()) {
      compactToast.error("Please enter your phone number");
      return false;
    }
    if (formData.phone_number.length < 10) {
      compactToast.error("Please enter a valid phone number");
      return false;
    }
    if (!formData.delivery_address.trim()) {
      compactToast.error("Please enter your delivery address");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    if (cart.items.length === 0) {
      compactToast.error("Your bag is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const { order, orderItems: createdItems } =
        await createOrderWithItemsAndStock({
          order: {
            customer_name: formData.customer_name,
            customer_email: formData.email || null,
            customer_phone: formData.phone_number,
            delivery_address: formData.delivery_address,
            delivery_fee: deliveryFee || 0,
            subtotal: cart.totalPrice,
            total_amount: cart.totalPrice + (deliveryFee || 0),
            payment_method: paymentMethod,
            payment_status: "pending",
            notes: formData.notes || null,
          },
          items: cart.items.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.selling_price,
            total_price: item.product.selling_price * item.quantity,
            quantity_in_stock: item.product.quantity_in_stock,
          })),
        });

      const displayItems = cart.items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        total_price: item.product.selling_price * item.quantity,
      }));

      // Show the confirmation immediately; the admin ping runs behind.
      setCompletedOrder(order);
      setOrderItems(displayItems.length ? displayItems : createdItems);
      setShowConfirmation(true);
      setIsSubmitting(false);

      void notifyAdminNewOrder(order).catch((error) =>
        console.error("Failed to send admin notification:", error),
      );

      if (saveInfo) {
        localStorage.setItem(
          "customerInfo",
          JSON.stringify({
            customer_name: formData.customer_name,
            phone_number: formData.phone_number,
            delivery_address: formData.delivery_address,
            email: formData.email,
            payment_method: paymentMethod,
          }),
        );
      }
      localStorage.setItem("lastOrderNumber", order.order_number);
      localStorage.setItem("lastOrderDate", new Date().toISOString());
    } catch (error) {
      console.error("Checkout error:", error);
      compactToast.error("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  }

  const subtotal = cart.totalPrice;
  const total = subtotal + (deliveryFee || 0);
  const freeDeliveryUnlocked = subtotal >= storeConfig.delivery.freeThreshold;

  const inputClass =
    "h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-shadow focus:ring-2";
  const inputStyle: React.CSSProperties = {
    background: "var(--sf-surface)",
    border: "1px solid var(--sf-line)",
    color: "var(--sf-ink)",
  };

  return (
    <>
      <motion.div
        // Opacity-only animation: a transform here would become the
        // containing block for the docked bar and break its position.
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "var(--sf-bg)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Top bar */}
        <div
          className="sticky top-0 z-10 border-b"
          style={{
            background: "rgba(250, 248, 244, 0.88)",
            backdropFilter: "blur(20px) saturate(1.6)",
            WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            borderColor: "var(--sf-line)",
          }}
        >
          <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-3">
              <span
                className="sf-display flex h-9 w-9 items-center justify-center rounded-xl text-lg font-semibold"
                style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
              >
                {storeConfig.monogram}
              </span>
              <h1
                className="sf-display text-xl font-semibold"
                style={{ color: "var(--sf-ink)" }}
              >
                Checkout
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <p
                className="hidden items-center gap-1.5 text-[12px] sm:flex"
                style={{ color: "var(--sf-ink-faint)" }}
              >
                <Lock className="h-3.5 w-3.5" />
                Secure checkout
              </p>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Close checkout"
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5 disabled:opacity-50"
                style={{ color: "var(--sf-ink)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <form id="sf-checkout-form" onSubmit={handleSubmit}>
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1fr_380px] lg:pb-16">
            {/* ── Left: details ── */}
            <div className="space-y-8">
              {/* Contact */}
              <section>
                <h2
                  className="sf-display mb-4 flex items-center gap-2.5 text-xl font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: "var(--sf-accent-soft)", color: "var(--sf-accent)" }}
                  >
                    1
                  </span>
                  Your details
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                      style={{ color: "var(--sf-ink-faint)" }}
                    />
                    <input
                      value={formData.customer_name}
                      onChange={(e) => handleInputChange("customer_name", e.target.value)}
                      placeholder="Full name"
                      aria-label="Full name"
                      required
                      className={`${inputClass} pl-11`}
                      style={inputStyle}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange("phone_number", e.target.value)}
                      placeholder="Phone · +254 712 345 678"
                      aria-label="Phone number"
                      required
                      className={inputClass}
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Email (optional)"
                      aria-label="Email"
                      className={inputClass}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <h2
                  className="sf-display mb-4 flex items-center gap-2.5 text-xl font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: "var(--sf-accent-soft)", color: "var(--sf-accent)" }}
                  >
                    2
                  </span>
                  Delivery
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {savedAddresses.map((address) => {
                      const formatted = formatSavedAddress(address);
                      const selected = formData.delivery_address === formatted;
                      return (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => applySavedAddress(address)}
                          className="rounded-2xl px-4 py-2.5 text-left transition-all"
                          style={
                            selected
                              ? {
                                  background: "var(--sf-accent-soft)",
                                  border: "1.5px solid var(--sf-accent)",
                                }
                              : {
                                  background: "var(--sf-surface)",
                                  border: "1px solid var(--sf-line)",
                                }
                          }
                        >
                          <p
                            className="text-[13.5px] font-semibold"
                            style={{ color: "var(--sf-ink)" }}
                          >
                            {address.label}
                            {address.isDefault ? " · Default" : ""}
                          </p>
                          <p
                            className="max-w-[220px] truncate text-[12px]"
                            style={{ color: "var(--sf-ink-faint)" }}
                          >
                            {formatted}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                <DeliveryAddressSelector
                  value={formData.delivery_address}
                  onChange={(address) => handleInputChange("delivery_address", address)}
                  onDeliveryFeeChange={setDeliveryFee}
                />

                <div className="relative mt-3">
                  <MessageSquare
                    className="pointer-events-none absolute left-4 top-3.5 h-[18px] w-[18px]"
                    style={{ color: "var(--sf-ink-faint)" }}
                  />
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Delivery notes (optional) — landmark, floor, preferred time…"
                    aria-label="Delivery notes"
                    rows={2}
                    className="w-full resize-none rounded-2xl py-3 pl-11 pr-4 text-[15px] outline-none transition-shadow focus:ring-2"
                    style={inputStyle}
                  />
                </div>
              </section>

              {/* Payment */}
              <section>
                <h2
                  className="sf-display mb-4 flex items-center gap-2.5 text-xl font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: "var(--sf-accent-soft)", color: "var(--sf-accent)" }}
                  >
                    3
                  </span>
                  Payment
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
                    const selected = paymentMethod === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        className="relative rounded-2xl p-4 text-left transition-all duration-200"
                        style={
                          selected
                            ? {
                                background: "var(--sf-accent-soft)",
                                border: "1.5px solid var(--sf-accent)",
                              }
                            : {
                                background: "var(--sf-surface)",
                                border: "1px solid var(--sf-line)",
                              }
                        }
                      >
                        <Icon
                          className="mb-2 h-5 w-5"
                          style={{
                            color: selected ? "var(--sf-accent)" : "var(--sf-ink-soft)",
                          }}
                        />
                        <p
                          className="text-[14px] font-semibold leading-tight"
                          style={{ color: "var(--sf-ink)" }}
                        >
                          {label}
                        </p>
                        <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--sf-ink-faint)" }}>
                          {hint}
                        </p>
                        {selected && (
                          <CheckCircle2
                            className="absolute right-3 top-3 h-[18px] w-[18px]"
                            style={{ color: "var(--sf-accent)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <label
                  className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl p-4"
                  style={{ background: "var(--sf-surface)", border: "1px solid var(--sf-line)" }}
                >
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="h-5 w-5 cursor-pointer rounded-md"
                    style={{ accentColor: "var(--sf-accent)" }}
                  />
                  <span className="text-[13.5px]" style={{ color: "var(--sf-ink-soft)" }}>
                    <span className="font-semibold" style={{ color: "var(--sf-ink)" }}>
                      Remember my details
                    </span>{" "}
                    for faster checkout next time
                  </span>
                </label>
              </section>
            </div>

            {/* ── Right: summary ── */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "var(--sf-surface)",
                  border: "1px solid var(--sf-line)",
                  boxShadow: "var(--sf-shadow-md)",
                }}
              >
                <h2
                  className="sf-display mb-4 text-lg font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  Your order
                </h2>

                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {cart.items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <span
                        className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg"
                        style={{ background: "var(--sf-bg-soft)" }}
                      >
                        <OptimizedImage
                          src={product.image_url}
                          alt={product.name}
                          preset="thumbnail"
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="line-clamp-1 text-[13.5px] font-medium"
                          style={{ color: "var(--sf-ink)" }}
                        >
                          {product.name}
                        </p>
                        <p className="text-[12px]" style={{ color: "var(--sf-ink-faint)" }}>
                          × {quantity}
                        </p>
                      </div>
                      <p
                        className="sf-tabular shrink-0 text-[13.5px] font-semibold"
                        style={{ color: "var(--sf-ink)" }}
                      >
                        {formatMoney(product.selling_price * quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <dl
                  className="mt-5 space-y-2 border-t pt-4 text-[14px]"
                  style={{ borderColor: "var(--sf-line)" }}
                >
                  <div className="flex justify-between" style={{ color: "var(--sf-ink-soft)" }}>
                    <dt>Subtotal</dt>
                    <dd className="sf-tabular">{formatMoney(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between" style={{ color: "var(--sf-ink-soft)" }}>
                    <dt className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      Delivery
                    </dt>
                    <dd
                      className="sf-tabular font-medium"
                      style={{
                        color:
                          deliveryFee === 0 ? "var(--sf-accent)" : "var(--sf-ink-soft)",
                      }}
                    >
                      {deliveryFee > 0 ? formatMoney(deliveryFee) : "Free"}
                    </dd>
                  </div>
                  {freeDeliveryUnlocked && (
                    <p className="text-[12px] font-medium" style={{ color: "var(--sf-accent)" }}>
                      🎉 Free-delivery threshold reached
                    </p>
                  )}
                  <div
                    className="flex items-baseline justify-between border-t pt-3"
                    style={{ borderColor: "var(--sf-line)" }}
                  >
                    <dt className="text-[15px] font-semibold" style={{ color: "var(--sf-ink)" }}>
                      Total
                    </dt>
                    <dd
                      className="sf-display sf-tabular text-2xl font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {formatMoney(total)}
                    </dd>
                  </div>
                </dl>

                {/* Desktop submit */}
                <button
                  type="submit"
                  disabled={isSubmitting || cart.items.length === 0}
                  className="mt-5 hidden min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 lg:flex"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-accent-ink)",
                    boxShadow: "var(--sf-shadow-accent)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    <>
                      Place order
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p
                  className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12px]"
                  style={{ color: "var(--sf-ink-faint)" }}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {storeConfig.delivery.returns}
                </p>
              </div>
            </aside>
          </div>

        </form>
        </div>

        {/* Docked submit bar (mobile) — a static flex-column child, so it
            can never drift with scrolling or animated ancestors. */}
        <div
          className="sf-safe-bottom border-t p-4 lg:hidden"
          style={{
            background: "rgba(250, 248, 244, 0.95)",
            borderColor: "var(--sf-line)",
          }}
        >
          <button
            type="submit"
            form="sf-checkout-form"
            disabled={isSubmitting || cart.items.length === 0}
            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--sf-accent)",
              color: "var(--sf-accent-ink)",
              boxShadow: "var(--sf-shadow-accent)",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Placing order…
              </>
            ) : (
              <>Place order · {formatMoney(total)}</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Success — reuses the proven confirmation with tracking links */}
      {completedOrder && (
        <OrderConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setCompletedOrder(null);
            setOrderItems([]);
            cart.clearCart();
            onClose();
          }}
          orderNumber={completedOrder.order_number}
          orderId={completedOrder.id}
          paymentReference={completedOrder.payment_reference}
          orderDetails={{
            customer_name: completedOrder.customer_name,
            customer_phone: completedOrder.customer_phone,
            delivery_address_label: selectedAddressLabel,
            delivery_address: completedOrder.delivery_address,
            total_amount: completedOrder.total_amount,
            payment_method: completedOrder.payment_method,
            items: orderItems,
          }}
        />
      )}
    </>
  );
}
