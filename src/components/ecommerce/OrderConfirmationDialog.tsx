import {
  CheckCircle,
  Copy,
  Package,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import Dialog from "./Dialog";
import Button from "./Button";
import Badge from "./Badge";
import compactToast from "../../utils/compactToast";
import Input from "./Input";
import { supabase } from "../../lib/supabase";
import { MPESA_CONFIG, PAYMENT_SECURITY } from "../../config/paymentConfig";

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: string;
  paymentReference?: string | null;
  orderDetails: {
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    total_amount: number;
    payment_method: string;
    items: Array<{
      product_name: string;
      quantity: number;
      total_price: number;
    }>;
  };
}

export default function OrderConfirmationDialog({
  isOpen,
  onClose,
  orderNumber,
  orderId,
  paymentReference,
  orderDetails,
}: OrderConfirmationDialogProps) {
  const [copied, setCopied] = useState(false);
  const [receiptCode, setReceiptCode] = useState("");
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    compactToast.success("Order number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const paymentMethodLabels: Record<string, string> = {
    mpesa: "M-Pesa",
    cash: "Cash on Delivery",
    card: "Card Payment",
    bank_transfer: "Bank Transfer",
  };

  const isMpesa = orderDetails.payment_method === "mpesa";
  const effectiveReference = paymentReference || orderNumber;
  const paybillNumber =
    MPESA_CONFIG.paybillNumber !== "REPLACE_WITH_PAYBILL"
      ? MPESA_CONFIG.paybillNumber
      : null;
  const tillNumber =
    MPESA_CONFIG.tillNumber !== "REPLACE_WITH_TILL"
      ? MPESA_CONFIG.tillNumber
      : null;

  const submitReceipt = async () => {
    const normalized = receiptCode.trim().toUpperCase();
    if (
      normalized.length < PAYMENT_SECURITY.receiptCodeMinLength ||
      normalized.length > PAYMENT_SECURITY.receiptCodeMaxLength
    ) {
      compactToast.error("Enter a valid M-Pesa receipt code");
      return;
    }

    setSubmittingReceipt(true);
    try {
      const paymentChannel = paybillNumber ? "mpesa_paybill" : "mpesa_till";
      const apiBase = import.meta.env.VITE_PAYMENT_API_URL as
        | string
        | undefined;

      if (apiBase) {
        const response = await fetch(`${apiBase}/api/payments/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            orderNumber,
            paymentReference: effectiveReference,
            customerPhone: orderDetails.customer_phone,
            amount: orderDetails.total_amount,
            receiptCode: normalized,
            paymentChannel,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to submit receipt");
        }
      } else {
        const { error } = await supabase.from("payment_confirmations").insert([
          {
            order_id: orderId,
            order_number: orderNumber,
            payment_reference: effectiveReference,
            customer_phone: orderDetails.customer_phone,
            amount: orderDetails.total_amount,
            receipt_code: normalized,
            status: "submitted",
          },
        ]);

        if (error) {
          console.error("Receipt submission error:", error);
          compactToast.error("Failed to submit receipt. Try again.");
          return;
        }
      }

      setReceiptSubmitted(true);
      setReceiptCode("");
      compactToast.success("Receipt submitted. We will verify shortly.");
    } catch (err) {
      console.error("Receipt submission error:", err);
      compactToast.error("Failed to submit receipt. Try again.");
    } finally {
      setSubmittingReceipt(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="text-center py-4 sm:py-8 px-3 sm:px-6">
        {/* Success Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
          Order Placed Successfully!
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 sm:mb-8">
          Thank you for your order. We'll process it shortly.
        </p>

        {/* Order Number - Prominent Display */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Your Order Number
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 font-mono break-all">
              {orderNumber}
            </span>
            <button
              onClick={copyOrderNumber}
              className="p-2 hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-lg transition-colors"
              title="Copy order number"
            >
              <Copy
                className={`w-5 h-5 ${
                  copied
                    ? "text-green-600"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            📋 This number is saved - you can track your order anytime
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 mb-4 sm:mb-6 text-left">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Order Summary
          </h3>

          {/* Items */}
          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
            {orderDetails.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-xs sm:text-sm gap-2"
              >
                <span className="text-slate-700 dark:text-slate-300 line-clamp-1">
                  {item.product_name} x {item.quantity}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                  KES {item.total_price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between">
            <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Total Amount
            </span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-base sm:text-lg">
              KES {orderDetails.total_amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Delivery & Payment Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-left">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Delivery Address
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {orderDetails.delivery_address}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <Phone className="w-3 h-3 inline mr-1" />
                  {orderDetails.customer_phone}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Payment Method
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {paymentMethodLabels[orderDetails.payment_method] ||
                    orderDetails.payment_method}
                </p>
                <Badge variant="warning" size="sm" className="mt-1">
                  Pending Payment
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Important Instructions */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left">
          <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-2 text-xs sm:text-sm">
            📱 Next Steps:
          </h4>
          <ul className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 space-y-1">
            <li>
              • Save your order number:{" "}
              <strong className="font-mono break-all">{orderNumber}</strong>
            </li>
            <li>• You'll receive a call shortly to confirm your order</li>
            <li>
              • Keep your phone <strong>{orderDetails.customer_phone}</strong>{" "}
              available
            </li>
            <li>
              • Prepare payment for{" "}
              {paymentMethodLabels[orderDetails.payment_method]}
            </li>
          </ul>
        </div>

        {/* M-Pesa Instructions + Receipt Submission */}
        {isMpesa && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 text-left">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-3 text-sm sm:text-base">
              M-Pesa Payment Instructions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Business Name
                </p>
                <p className="text-emerald-900 dark:text-emerald-100 font-semibold">
                  {MPESA_CONFIG.businessName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  Amount
                </p>
                <p className="text-emerald-900 dark:text-emerald-100 font-semibold">
                  KES {orderDetails.total_amount.toLocaleString()}
                </p>
              </div>
              {paybillNumber && (
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Paybill Number
                  </p>
                  <p className="text-emerald-900 dark:text-emerald-100 font-semibold">
                    {paybillNumber}
                  </p>
                </div>
              )}
              {tillNumber && (
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Till Number
                  </p>
                  <p className="text-emerald-900 dark:text-emerald-100 font-semibold">
                    {tillNumber}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {MPESA_CONFIG.accountLabel}
                </p>
                <p className="text-emerald-900 dark:text-emerald-100 font-semibold font-mono break-all">
                  {effectiveReference}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-2">
                After paying, enter your M-Pesa receipt code to confirm payment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={receiptCode}
                  onChange={(e) => setReceiptCode(e.target.value)}
                  placeholder="Receipt code (e.g. QF12ABC34)"
                  aria-label="M-Pesa receipt code"
                />
                <Button
                  variant="primary"
                  size="md"
                  onClick={submitReceipt}
                  disabled={submittingReceipt || receiptSubmitted}
                  isLoading={submittingReceipt}
                >
                  {receiptSubmitted ? "Receipt Submitted" : "Submit Receipt"}
                </Button>
              </div>
              {receiptSubmitted && (
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  Thanks! We will verify and confirm your payment shortly.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={onClose}>
            Continue Shopping
          </Button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Need help? Call us at <strong>{MPESA_CONFIG.supportPhone}</strong>
        </p>
      </div>
    </Dialog>
  );
}
