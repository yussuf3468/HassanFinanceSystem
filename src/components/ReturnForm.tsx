import { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, Package, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import { invalidateAfterReturn } from "../utils/cacheInvalidation";

interface ReturnFormProps {
  products: Product[];
  sales?: any[]; // optional sales list for linking
  onClose: () => void;
  onSuccess: () => void;
}

const paymentMethods = [
  "Cash",
  "Mpesa",
  "Till Number",
  "Card",
  "Bank Transfer",
];
const staffMembers = ["Khalid", "Yussuf", "Zakaria"];

interface ReceiptItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_refund: number;
}

interface ReceiptData {
  id: string;
  return_date: Date;
  processed_by: string;
  payment_method?: string;
  items: ReceiptItem[];
  reason?: string | null;
  condition?: string | null;
  total_refund: number;
}

export default function ReturnForm({
  products,
  sales = [],
  onClose,
  onSuccess,
}: ReturnFormProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [saleId, setSaleId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("Sealed");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [processedBy, setProcessedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.product_id.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  }, [searchTerm, products]);

  const product = products.find((p) => p.id === productId);
  const qtyNum = parseInt(quantity || "0") || 0;
  const refundTotal = product ? product.selling_price * qtyNum : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!processedBy) {
      alert("Please select staff (Processed By). ");
      return;
    }
    if (!product) {
      alert("Select a product.");
      return;
    }
    if (qtyNum <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      // Insert return record
      const { error } = await supabase.from("returns").insert({
        sale_id: saleId || null,
        product_id: product.id,
        quantity_returned: qtyNum,
        unit_price: product.selling_price,
        total_refund: refundTotal,
        reason: reason || null,
        condition: condition || null,
        payment_method: paymentMethod !== "None" ? paymentMethod : null,
        processed_by: processedBy,
        notes: notes || null,
        status: "pending",
      });
      if (error) throw error;

      // Update inventory: Add returned quantity back to stock
      const { error: updateError } = await supabase
        .from("products")
        .update({
          quantity_in_stock: product.quantity_in_stock + qtyNum,
        })
        .eq("id", product.id);

      if (updateError) {
        console.error("Error updating inventory:", updateError);
        alert(
          "Return recorded but failed to update inventory. Please update stock manually."
        );
      }

      // Record negative sale entry to reflect the refund in sales/revenue tracking
      const { error: saleError } = await supabase.from("sales").insert({
        product_id: product.id,
        quantity_sold: -qtyNum, // Negative quantity to indicate return
        selling_price: product.selling_price,
        buying_price: product.buying_price,
        total_sale: -refundTotal, // Negative total to reduce revenue
        profit: -(product.selling_price - product.buying_price) * qtyNum, // Negative profit
        payment_method: paymentMethod !== "None" ? paymentMethod : "Cash",
        sold_by: processedBy,
        sale_date: new Date().toISOString(),
        original_price: product.selling_price,
        final_price: product.selling_price,
        discount_percentage: 0,
        discount_amount: 0,
      });

      if (saleError) {
        console.error("Error recording refund in sales:", saleError);
        alert(
          "Return recorded but failed to update sales. Revenue may not reflect the refund."
        );
      }

      setReceipt({
        id: crypto.randomUUID(),
        return_date: new Date(),
        processed_by: processedBy,
        payment_method: paymentMethod !== "None" ? paymentMethod : undefined,
        items: [
          {
            product_name: product.name,
            quantity: qtyNum,
            unit_price: product.selling_price,
            total_refund: refundTotal,
          },
        ],
        reason: reason || null,
        condition: condition || null,
        total_refund: refundTotal,
      });

      // ✅ Invalidate caches to update dashboard immediately
      await invalidateAfterReturn(queryClient);
    } catch (err) {
      console.error("Error recording return", err);
      alert("Failed to record return.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinish() {
    setReceipt(null);
    setSearchTerm("");
    setProductId("");
    setQuantity("");
    setSaleId("");
    setReason("");
    setCondition("Sealed");
    setPaymentMethod("Cash");
    setProcessedBy("");
    setNotes("");
    onSuccess();
  }

  function printReceipt() {
    window.print();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto border border-amber-200/60 dark:border-slate-700 animate-scaleIn print:static print:max-h-none print:overflow-visible print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-900/50 dark:to-slate-800 p-6 rounded-t-2xl print:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-amber-500/20 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white">
                ↩️ Record Product Return
              </h3>
              <p className="text-white/90 text-sm font-medium">
                Capture returned items & restore stock
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-all duration-300 hover:scale-110 text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Receipt View */}
        {receipt && (
          <div className="p-6 space-y-6 print:bg-white print:text-black dark:bg-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white print:text-black">
                  Return Receipt
                </h2>
                <p className="text-slate-900/70 dark:text-slate-300 text-sm print:text-black">
                  Date: {receipt.return_date.toLocaleString()}
                </p>
                <p className="text-slate-900/70 dark:text-slate-300 text-sm print:text-black">
                  Processed By: {receipt.processed_by}
                  {receipt.payment_method
                    ? ` • Refund via ${receipt.payment_method}`
                    : ""}
                </p>
                {receipt.reason && (
                  <p className="text-slate-900/70 dark:text-slate-300 text-sm print:text-black">
                    Reason: {receipt.reason}
                  </p>
                )}
                {receipt.condition && (
                  <p className="text-slate-900/70 dark:text-slate-300 text-sm print:text-black">
                    Condition: {receipt.condition}
                  </p>
                )}
              </div>
              <div className="print:hidden flex space-x-2">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl flex items-center space-x-2 hover:from-amber-600 hover:to-amber-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleFinish}
                  className="px-4 py-2 border border-amber-200/60 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl hover:bg-amber-50/40 dark:hover:bg-slate-700"
                >
                  Finish
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-amber-200/60 dark:border-slate-700 print:border-slate-300">
              <table className="w-full text-sm">
                <thead className="bg-amber-50/40 dark:bg-slate-700 text-slate-900 dark:text-white print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-4 py-2 text-left text-slate-900/80 dark:text-slate-300">
                      Product
                    </th>
                    <th className="px-4 py-2 text-right text-slate-900/80 dark:text-slate-300">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right text-slate-900/80 dark:text-slate-300">
                      Unit Price
                    </th>
                    <th className="px-4 py-2 text-right text-slate-900/80 dark:text-slate-300">
                      Refund Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((it, i) => (
                    <tr
                      key={i}
                      className="odd:bg-white dark:odd:bg-slate-800 even:bg-amber-50/20 dark:even:bg-slate-700/50 text-slate-900 dark:text-white print:odd:bg-white"
                    >
                      <td className="px-4 py-2">{it.product_name}</td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        KES {it.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-rose-600 print:text-black">
                        KES {it.total_refund.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50/40 dark:bg-slate-700 font-semibold text-slate-900 dark:text-white print:bg-slate-100 print:text-black">
                  <tr>
                    <td className="px-4 py-2 text-right" colSpan={3}>
                      Total Refund
                    </td>
                    <td className="px-4 py-2 text-right text-rose-600 print:text-black">
                      KES {receipt.total_refund.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {!receipt && (
          <form onSubmit={handleSubmit} className="p-6 space-y-8 print:hidden">
            {/* Product Selection */}
            <div ref={dropdownRef}>
              <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                Product *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) setProductId("");
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search product..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
                {showDropdown && searchTerm && filteredProducts.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setProductId(p.id);
                          setSearchTerm(p.name);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-amber-50/40 dark:hover:bg-slate-600 text-sm flex items-center space-x-2"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center">
                            <Package className="w-4 h-4 text-amber-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-900/60 dark:text-slate-400 truncate">
                            {p.product_id} • Stock {p.quantity_in_stock} • KES{" "}
                            {p.selling_price.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity & Optional Sale Link */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Quantity Returned *
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Link to Sale (Optional)
                </label>
                <input
                  type="text"
                  value={saleId}
                  onChange={(e) => setSaleId(e.target.value)}
                  placeholder="Paste Sale ID if available"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
            </div>

            {/* Refund Summary */}
            {product && qtyNum > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-amber-50/40 dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-md p-2">
                  <span className="text-slate-900/60 dark:text-slate-400 block">
                    Unit Price
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    KES {product.selling_price.toLocaleString()}
                  </span>
                </div>
                <div className="bg-amber-50/40 dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-md p-2">
                  <span className="text-slate-900/60 dark:text-slate-400 block">
                    Qty
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {qtyNum}
                  </span>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-md p-2">
                  <span className="text-slate-900/60 dark:text-slate-400 block">
                    Refund Total
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    KES {refundTotal.toLocaleString()}
                  </span>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-md p-2">
                  <span className="text-slate-900/60 dark:text-slate-400 block">
                    Stock After Return
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {product.quantity_in_stock + qtyNum}
                  </span>
                </div>
              </div>
            )}

            {/* Reason / Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Damaged packaging"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                >
                  {["Sealed", "Opened", "Damaged", "Other"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method & Staff */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Refund Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                  Processed By (Staff) *
                </label>
                <select
                  required
                  value={processedBy}
                  onChange={(e) => setProcessedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffMembers.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-900/70 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-amber-200/60 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                placeholder="Additional details..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-amber-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 border border-amber-200/60 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl hover:bg-amber-50/40 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? "Recording Return..." : "Record Return"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
