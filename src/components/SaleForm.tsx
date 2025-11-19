import { useState, useEffect, useRef } from "react";
import { X, Search, Package, Plus, Trash2, Printer } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

type DiscountType = "none" | "percentage" | "amount";

interface LineItem {
  id: string; // local unique id for rendering
  product_id: string;
  quantity: string;
  discount_type: DiscountType;
  discount_value: string;
  // UI helpers
  searchTerm: string;
  showDropdown: boolean;
}

interface ReceiptData {
  transactionId: string;
  sold_by: string;
  payment_method: string;
  created_at: Date;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    original_total: number;
    discount_amount: number;
    final_unit_price: number;
    line_total: number;
    profit: number;
  }[];
  subtotal: number;
  total_discount: number;
  total: number;
  total_profit: number;
}

const paymentMethods = ["Cash", "Mpesa", "Card", "Bank Transfer"];
const staffMembers = ["Yussuf", "Khaled", "Zakaria"];

export default function SaleForm({
  products,
  onClose,
  onSuccess,
}: SaleFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [soldBy, setSoldBy] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      product_id: "",
      quantity: "",
      discount_type: "none",
      discount_value: "",
      searchTerm: "",
      showDropdown: false,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Refs for clicking outside dropdowns
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      setLineItems((items) =>
        items.map((li) => {
          const ref = dropdownRefs.current[li.id];
          if (ref && !ref.contains(target)) {
            return { ...li, showDropdown: false };
          }
          return li;
        })
      );
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLineItems((items) =>
      items.map((li) => (li.id === id ? { ...li, ...patch } : li))
    );
  }

  function addLine() {
    setLineItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        product_id: "",
        quantity: "",
        discount_type: "none",
        discount_value: "",
        searchTerm: "",
        showDropdown: false,
      },
    ]);
  }

  function removeLine(id: string) {
    setLineItems((items) => items.filter((li) => li.id !== id));
  }

  const productById = (id: string) => products.find((p) => p.id === id);

  // Merge duplicate product lines automatically (optional behavior)
  function consolidateDuplicates() {
    const map: Record<string, LineItem> = {};
    for (const item of lineItems) {
      if (!item.product_id) continue;
      if (!map[item.product_id]) {
        map[item.product_id] = { ...item };
      } else {
        const q1 = parseInt(map[item.product_id].quantity || "0") || 0;
        const q2 = parseInt(item.quantity || "0") || 0;
        map[item.product_id].quantity = String(q1 + q2);
        // If discounts differ, keep first; advanced merging logic could be added here.
      }
    }
    setLineItems(
      Object.values(map).concat(lineItems.filter((i) => !i.product_id))
    );
  }

  interface ComputedLine {
    line: LineItem;
    product?: Product;
    quantity: number;
    original_total: number;
    discount_amount: number;
    final_total: number;
    final_unit_price: number;
    profit: number;
  }

  function computeLines(): ComputedLine[] {
    return lineItems.map((li) => {
      const product = productById(li.product_id);
      const quantity = parseInt(li.quantity || "0") || 0;
      if (!product || quantity <= 0) {
        return {
          line: li,
          product: product,
          quantity,
          original_total: 0,
          discount_amount: 0,
          final_total: 0,
          final_unit_price: 0,
          profit: 0,
        };
      }
      const original_total = product.selling_price * quantity;
      let discount_amount = 0;
      if (li.discount_type === "percentage" && li.discount_value) {
        discount_amount =
          (original_total * parseFloat(li.discount_value)) / 100;
      } else if (li.discount_type === "amount" && li.discount_value) {
        discount_amount = parseFloat(li.discount_value);
      }
      if (discount_amount > original_total) discount_amount = original_total;
      const final_total = original_total - discount_amount;
      const final_unit_price = quantity > 0 ? final_total / quantity : 0;
      const profit = (final_unit_price - product.buying_price) * quantity;
      return {
        line: li,
        product,
        quantity,
        original_total,
        discount_amount,
        final_total,
        final_unit_price,
        profit,
      };
    });
  }

  const computed = computeLines();
  const subtotal = computed.reduce((s, c) => s + c.original_total, 0);
  const total_discount = computed.reduce((s, c) => s + c.discount_amount, 0);
  const total = subtotal - total_discount;
  const total_profit = computed.reduce((s, c) => s + c.profit, 0);

  function validateStock(): { ok: boolean; message?: string } {
    // Aggregate requested quantity per product
    const aggregate: Record<string, number> = {};
    for (const c of computed) {
      if (!c.product || c.quantity <= 0) continue;
      aggregate[c.product.id] = (aggregate[c.product.id] || 0) + c.quantity;
    }
    for (const [pid, q] of Object.entries(aggregate)) {
      const prod = productById(pid)!;
      if (q > prod.quantity_in_stock) {
        return {
          ok: false,
          message: `Insufficient stock for ${prod.name}. Requested ${q}, available ${prod.quantity_in_stock}.`,
        };
      }
    }
    return { ok: true };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Basic validation
    if (!soldBy) {
      alert("Please select staff (Sold By).");
      return;
    }
    if (
      computed.length === 0 ||
      computed.every((c) => c.quantity <= 0 || !c.product)
    ) {
      alert("Please add at least one valid product line.");
      return;
    }

    // Stock validation
    const stockCheck = validateStock();
    if (!stockCheck.ok) {
      alert(stockCheck.message);
      return;
    }

    setSubmitting(true);

    // Create a transaction ID for grouping this sale
    const transactionId = crypto.randomUUID();

    // NOTE: This implementation assumes you added a transaction_id column
    // to the existing 'sales' table.
    // For a normalized schema (sale_transactions + sale_items), see comments below.
    try {
      // Optional: If using normalized schema, first insert into sale_transactions:
      // const { data: txData, error: txError } = await supabase.from("sale_transactions").insert({
      //   id: transactionId,
      //   payment_method: paymentMethod,
      //   sold_by: soldBy,
      //   subtotal,
      //   total_discount,
      //   total
      // }).select().single();
      // if (txError) throw txError;

      // Insert each line as a row into 'sales' (legacy approach).
      for (const c of computed) {
        if (!c.product || c.quantity <= 0) continue;
        const discount_percentage =
          c.line.discount_type === "percentage"
            ? parseFloat(c.line.discount_value || "0")
            : 0;

        const { error: lineError } = await supabase.from("sales").insert({
          transaction_id: transactionId,
          product_id: c.product.id,
          quantity_sold: c.quantity,
          selling_price: c.product.selling_price,
          buying_price: c.product.buying_price,
          total_sale: c.final_total,
          profit: c.profit,
          payment_method: paymentMethod,
          sold_by: soldBy,
          discount_amount: c.discount_amount,
          discount_percentage,
          original_price: c.product.selling_price,
          final_price: c.final_unit_price,
        });

        if (lineError) throw lineError;

        // Update stock
        const newStock = c.product.quantity_in_stock - c.quantity;
        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity_in_stock: newStock })
          .eq("id", c.product.id);
        if (stockError) throw stockError;

        // If using normalized schema:
        // await supabase.from("sale_items").insert({
        //   transaction_id: transactionId,
        //   product_id: c.product.id,
        //   quantity: c.quantity,
        //   original_unit_price: c.product.selling_price,
        //   discount_type: c.line.discount_type,
        //   discount_value: c.line.discount_value ? parseFloat(c.line.discount_value) : 0,
        //   discount_amount: c.discount_amount,
        //   final_unit_price: c.final_unit_price,
        //   line_total: c.final_total,
        //   profit: c.profit
        // });
      }

      // Build receipt data
      const receiptData: ReceiptData = {
        transactionId,
        sold_by: soldBy,
        payment_method: paymentMethod,
        created_at: new Date(),
        items: computed
          .filter((c) => c.product && c.quantity > 0)
          .map((c) => ({
            product_name: c.product!.name,
            quantity: c.quantity,
            unit_price: c.product!.selling_price,
            original_total: c.original_total,
            discount_amount: c.discount_amount,
            final_unit_price: c.final_unit_price,
            line_total: c.final_total,
            profit: c.profit,
          })),
        subtotal,
        total_discount,
        total,
        total_profit,
      };

      setReceipt(receiptData);
    } catch (err) {
      console.error("Error recording multi-product sale:", err);
      alert(
        "Failed to record sale. Consider implementing a Postgres function for transactional safety."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function printReceipt() {
    window.print();
  }

  function resetForm() {
    setLineItems([
      {
        id: crypto.randomUUID(),
        product_id: "",
        quantity: "",
        discount_type: "none",
        discount_value: "",
        searchTerm: "",
        showDropdown: false,
      },
    ]);
    setSoldBy("");
    setPaymentMethod("Cash");
    setReceipt(null);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-white/20 animate-scaleIn print:static print:max-h-none print:overflow-visible print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl print:hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-white">
                💰 Diiwaan Gali Iib Cusub (Multi-Product) - Record New Sale
              </h3>
              <p className="text-purple-100 text-sm font-medium">
                Ku dar alaabooyin badan hal iib gudaheed
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

        {/* Receipt View */}
        {receipt && (
          <div className="p-6 space-y-6 bg-white/5 backdrop-blur-xl print:bg-white print:text-black">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-white print:text-black">
                  Sales Receipt
                </h2>
                <p className="text-slate-300 text-sm print:text-black">
                  Transaction: {receipt.transactionId}
                </p>
                <p className="text-slate-300 text-sm print:text-black">
                  Date: {receipt.created_at.toLocaleString()}
                </p>
                <p className="text-slate-300 text-sm print:text-black">
                  Sold By: {receipt.sold_by} • Payment: {receipt.payment_method}
                </p>
              </div>
              <div className="print:hidden flex space-x-2">
                <button
                  onClick={printReceipt}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center space-x-2 hover:from-purple-700 hover:to-blue-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10"
                >
                  New Sale
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/20 print:border-slate-300">
              <table className="w-full text-sm">
                <thead className="bg-white/10 text-white print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Unit</th>
                    <th className="px-4 py-2 text-right">Orig Total</th>
                    <th className="px-4 py-2 text-right">Discount</th>
                    <th className="px-4 py-2 text-right">Line Total</th>
                    <th className="px-4 py-2 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((it, idx) => (
                    <tr key={idx} className="odd:bg-white/5 print:odd:bg-white">
                      <td className="px-4 py-2">{it.product_name}</td>
                      <td className="px-4 py-2 text-right">{it.quantity}</td>
                      <td className="px-4 py-2 text-right">
                        KES {it.unit_price.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        KES {it.original_total.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-red-400 print:text-red-600">
                        {it.discount_amount > 0
                          ? "-KES " + it.discount_amount.toLocaleString()
                          : "-"}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold">
                        KES {it.line_total.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-green-400 print:text-green-600">
                        KES {it.profit.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-white/10 font-semibold print:bg-slate-100 print:text-black">
                  <tr>
                    <td className="px-4 py-2 text-right" colSpan={5}>
                      Subtotal
                    </td>
                    <td className="px-4 py-2 text-right">
                      KES {receipt.subtotal.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-right" colSpan={5}>
                      Discount
                    </td>
                    <td className="px-4 py-2 text-right text-red-400 print:text-red-600">
                      -KES {receipt.total_discount.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-right" colSpan={5}>
                      Total
                    </td>
                    <td className="px-4 py-2 text-right text-purple-300 print:text-black">
                      KES {receipt.total.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-right" colSpan={5}>
                      Profit
                    </td>
                    <td className="px-4 py-2 text-right text-green-400 print:text-green-600">
                      KES {receipt.total_profit.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="print:hidden flex justify-end">
              <button
                onClick={onSuccess}
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/5"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {!receipt && (
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-8 bg-white/5 backdrop-blur-xl print:hidden"
          >
            {/* Line Items */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">Products</h4>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Line</span>
                  </button>
                  <button
                    type="button"
                    onClick={consolidateDuplicates}
                    className="px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10"
                  >
                    Merge Duplicates
                  </button>
                </div>
              </div>

              {lineItems.map((li, idx) => {
                const product = productById(li.product_id);
                const comp = computed.find((c) => c.line.id === li.id)!;
                const filtered = products.filter(
                  (p) =>
                    p.name
                      .toLowerCase()
                      .includes(li.searchTerm.toLowerCase()) ||
                    p.product_id
                      .toLowerCase()
                      .includes(li.searchTerm.toLowerCase()) ||
                    p.category
                      .toLowerCase()
                      .includes(li.searchTerm.toLowerCase())
                );
                return (
                  <div
                    key={li.id}
                    ref={(el) => (dropdownRefs.current[li.id] = el)}
                    className="relative bg-white/5 border border-white/20 rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-white">
                          Line {idx + 1}
                        </span>
                        {product && (
                          <span className="text-xs px-2 py-1 bg-purple-600/30 text-purple-200 rounded">
                            Stock: {product.quantity_in_stock}
                          </span>
                        )}
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(li.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-red-300 hover:text-red-200"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                      {/* Product Search */}
                      <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Product *
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={li.searchTerm}
                            required={!li.product_id}
                            onChange={(e) =>
                              updateLine(li.id, {
                                searchTerm: e.target.value,
                                showDropdown: true,
                                product_id: e.target.value ? li.product_id : "",
                              })
                            }
                            onFocus={() =>
                              updateLine(li.id, { showDropdown: true })
                            }
                            placeholder="Search product..."
                            className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500"
                          />
                          {li.showDropdown &&
                            li.searchTerm &&
                            filtered.length > 0 && (
                              <div className="absolute z-20 w-full mt-2 bg-slate-900 border border-white/20 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                                {filtered.slice(0, 15).map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() =>
                                      updateLine(li.id, {
                                        product_id: p.id,
                                        searchTerm: p.name,
                                        showDropdown: false,
                                      })
                                    }
                                    className="w-full text-left px-3 py-2 hover:bg-white/10 text-sm flex items-center space-x-2"
                                  >
                                    {p.image_url ? (
                                      <img
                                        src={p.image_url}
                                        alt={p.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                                        <Package className="w-4 h-4 text-slate-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium text-white truncate">
                                        {p.name}
                                      </p>
                                      <p className="text-xs text-slate-400 truncate">
                                        {p.product_id} • Stock{" "}
                                        {p.quantity_in_stock} • KES{" "}
                                        {p.selling_price.toLocaleString()}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                                {filtered.length > 15 && (
                                  <div className="px-3 py-2 text-xs text-slate-400">
                                    Showing first 15 of {filtered.length}{" "}
                                    results
                                  </div>
                                )}
                              </div>
                            )}
                          {li.showDropdown &&
                            li.searchTerm &&
                            filtered.length === 0 && (
                              <div className="absolute z-20 w-full mt-2 bg-slate-900 border border-white/20 rounded-lg shadow-xl p-3 text-center text-slate-400 text-sm">
                                No matches for "{li.searchTerm}"
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={li.quantity}
                          onChange={(e) =>
                            updateLine(li.id, { quantity: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="Qty"
                        />
                      </div>

                      {/* Discount Type */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Discount Type
                        </label>
                        <select
                          value={li.discount_type}
                          onChange={(e) =>
                            updateLine(li.id, {
                              discount_type: e.target.value as DiscountType,
                              discount_value: "",
                            })
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option
                            value="none"
                            className="bg-slate-900 text-white"
                          >
                            None
                          </option>
                          <option
                            value="percentage"
                            className="bg-slate-900 text-white"
                          >
                            %
                          </option>
                          <option
                            value="amount"
                            className="bg-slate-900 text-white"
                          >
                            Amount
                          </option>
                        </select>
                      </div>

                      {/* Discount Value */}
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          disabled={li.discount_type === "none"}
                          value={li.discount_value}
                          onChange={(e) =>
                            updateLine(li.id, {
                              discount_value: e.target.value,
                            })
                          }
                          min="0"
                          max={
                            li.discount_type === "percentage" ? 100 : undefined
                          }
                          step={
                            li.discount_type === "percentage" ? "0.01" : "1"
                          }
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-40"
                          placeholder={
                            li.discount_type === "percentage"
                              ? "10 (%)"
                              : "100 (KES)"
                          }
                        />
                      </div>
                    </div>

                    {/* Line Summary */}
                    {product && comp.quantity > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mt-2">
                        <div className="bg-white/10 rounded-md p-2">
                          <span className="text-slate-300 block">Original</span>
                          <span className="font-semibold text-purple-300">
                            KES {comp.original_total.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white/10 rounded-md p-2">
                          <span className="text-slate-300 block">Discount</span>
                          <span className="font-semibold text-red-400">
                            {comp.discount_amount > 0
                              ? "-KES " + comp.discount_amount.toLocaleString()
                              : "-"}
                          </span>
                        </div>
                        <div className="bg-white/10 rounded-md p-2">
                          <span className="text-slate-300 block">
                            Line Total
                          </span>
                          <span className="font-semibold text-blue-300">
                            KES {comp.final_total.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white/10 rounded-md p-2">
                          <span className="text-slate-300 block">Profit</span>
                          <span className="font-semibold text-green-400">
                            KES {comp.profit.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall Totals */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-xl p-6 border border-purple-500/30 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Subtotal:</span>
                <span className="font-semibold text-white">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Total Discount:</span>
                <span className="font-semibold text-red-400">
                  -KES {total_discount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-base border-t border-white/20 pt-3 font-bold text-purple-300">
                <span>Final Total:</span>
                <span>KES {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Estimated Profit:</span>
                <span className="font-semibold text-green-400">
                  KES {total_profit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment + Staff moved to bottom */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  {paymentMethods.map((m) => (
                    <option
                      key={m}
                      value={m}
                      className="bg-slate-900 text-white"
                    >
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Sold By (Staff) *
                </label>
                <select
                  required
                  value={soldBy}
                  onChange={(e) => setSoldBy(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-slate-900 text-white">
                    -- Select Staff Member --
                  </option>
                  {staffMembers.map((s) => (
                    <option
                      key={s}
                      value={s}
                      className="bg-slate-900 text-white"
                    >
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/20">
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
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {submitting ? "Recording Sale..." : "Record Sale"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
