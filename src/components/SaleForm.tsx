import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Package,
  Plus,
  Trash2,
  Printer,
  ShoppingCart,
  TrendingUp,
  Clock,
  Users,
} from "lucide-react";
import { searchProducts, getSearchSuggestions } from "../utils/searchUtils";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Product, InternalCustomer } from "../types";
import { invalidateAfterSale } from "../utils/cacheInvalidation";
import { StockReceiveModal } from "./StockReceiveModal";

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

type DiscountType = "none" | "percentage" | "amount";

interface LineItem {
  id: string;
  product_id: string;
  quantity: string;
  discount_type: DiscountType;
  discount_value: string;
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
  total_line_discount: number;
  overall_discount_type: DiscountType;
  overall_discount_value: number;
  overall_discount_amount: number;
  total: number;
  total_profit: number;
}

const paymentMethods = [
  "Cash",
  "Mpesa",
  "Till Number",
  "Card",
  "Bank Transfer",
];
const staffMembers = ["Khalid", "Zakaria", "Yussuf"];

export default function SaleForm({
  products,
  onClose,
  onSuccess,
}: SaleFormProps) {
  const queryClient = useQueryClient();
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

  // Overall discount state
  const [overallDiscountType, setOverallDiscountType] =
    useState<DiscountType>("none");
  const [overallDiscountValue, setOverallDiscountValue] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Customer selection state
  const [customers, setCustomers] = useState<InternalCustomer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    "00000000-0000-0000-0000-000000000001"
  ); // Default to Walk-in Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("is_active", true)
        .order("customer_name");

      if (error) throw error;
      setCustomers((data as unknown as InternalCustomer[]) || []);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  }

  // Stock receive modal state
  const [showStockModal, setShowStockModal] = useState(false);
  const [currentStockItem, setCurrentStockItem] = useState<{
    product: Product;
    requested: number;
    available: number;
    shortage: number;
  } | null>(null);
  const [pendingStockItems, setPendingStockItems] = useState<
    Array<{
      product: Product;
      requested: number;
      available: number;
      shortage: number;
    }>
  >([]);

  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;

      // Close customer dropdown
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(target)
      ) {
        setShowCustomerDropdown(false);
      }

      // Close product line dropdowns
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
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
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
  const total_line_discount = computed.reduce(
    (s, c) => s + c.discount_amount,
    0
  );
  const subtotalAfterLineDiscounts = subtotal - total_line_discount;

  // Calculate overall discount
  let overallDiscountAmount = 0;
  const overallDiscountNum = parseFloat(overallDiscountValue) || 0;

  if (overallDiscountType === "percentage" && overallDiscountNum > 0) {
    overallDiscountAmount =
      (subtotalAfterLineDiscounts * overallDiscountNum) / 100;
  } else if (overallDiscountType === "amount" && overallDiscountNum > 0) {
    overallDiscountAmount = overallDiscountNum;
  }

  if (overallDiscountAmount > subtotalAfterLineDiscounts) {
    overallDiscountAmount = subtotalAfterLineDiscounts;
  }

  const total = subtotalAfterLineDiscounts - overallDiscountAmount;

  // Calculate total profit: sum of individual line profits minus overall discount
  const sumOfLineProfits = computed.reduce((s, c) => s + c.profit, 0);
  const total_profit = sumOfLineProfits - overallDiscountAmount;

  function validateStock(): {
    ok: boolean;
    outOfStockItems?: Array<{
      product: Product;
      requested: number;
      available: number;
      shortage: number;
    }>;
  } {
    const aggregate: Record<string, number> = {};
    const outOfStockItems: Array<{
      product: Product;
      requested: number;
      available: number;
      shortage: number;
    }> = [];

    for (const c of computed) {
      if (!c.product || c.quantity <= 0) continue;
      aggregate[c.product.id] = (aggregate[c.product.id] || 0) + c.quantity;
    }

    for (const [pid, q] of Object.entries(aggregate)) {
      const prod = productById(pid)!;
      if (q > prod.quantity_in_stock) {
        outOfStockItems.push({
          product: prod,
          requested: q,
          available: prod.quantity_in_stock,
          shortage: q - prod.quantity_in_stock,
        });
      }
    }

    return {
      ok: true,
      outOfStockItems: outOfStockItems.length > 0 ? outOfStockItems : undefined,
    };
  }

  async function handleReceiveStock(quantity: number, source: string) {
    if (!currentStockItem) return;

    try {
      const item = currentStockItem;
      const newStock = item.product.quantity_in_stock + quantity;

      // Update product stock
      const { error: stockError } = await supabase
        .from("products")
        .update({ quantity_in_stock: newStock })
        .eq("id", item.product.id);

      if (stockError) throw stockError;

      // Record in stock receipts trail with source information
      const { error: receiptError } = await (supabase as any).rpc(
        "process_stock_receipt",
        {
          p_items: [
            {
              product_id: item.product.id,
              quantity: quantity,
              cost_per_unit: null,
              received_by: soldBy,
              notes: source, // Include source in notes
            },
          ],
        }
      );

      if (receiptError) {
        console.error("Stock receipt trail error:", receiptError);
      }

      // Update local product data
      item.product.quantity_in_stock = newStock;

      // Move to next item or close modal if done
      const nextItems = pendingStockItems.slice(1);
      if (nextItems.length > 0) {
        setPendingStockItems(nextItems);
        setCurrentStockItem(nextItems[0]);
      } else {
        setShowStockModal(false);
        setCurrentStockItem(null);
        setPendingStockItems([]);

        // Automatically continue the sale submission
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            );
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert(
        `Failed to update stock for ${currentStockItem.product.name}. Please try again.`
      );
    }
  }

  function handleSkipItem() {
    // Remove this item from the sale
    if (!currentStockItem) return;

    // Remove line items for this product
    setLineItems((items) =>
      items.filter((li) => li.product_id !== currentStockItem.product.id)
    );

    // Move to next item or close modal if done
    const nextItems = pendingStockItems.slice(1);
    if (nextItems.length > 0) {
      setPendingStockItems(nextItems);
      setCurrentStockItem(nextItems[0]);
    } else {
      setShowStockModal(false);
      setCurrentStockItem(null);
      setPendingStockItems([]);

      // Automatically resubmit the form
      setTimeout(() => {
        const form = document.querySelector("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true })
          );
        }
      }, 100);
    }
  }

  function handleCancelSale() {
    setShowStockModal(false);
    setCurrentStockItem(null);
    setPendingStockItems([]);
    // Sale form remains open for user to modify
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

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

    const stockCheck = validateStock();

    // ✅ Handle out-of-stock items with modal UI
    if (stockCheck.outOfStockItems && stockCheck.outOfStockItems.length > 0) {
      setPendingStockItems(stockCheck.outOfStockItems);
      setCurrentStockItem(stockCheck.outOfStockItems[0]);
      setShowStockModal(true);
      return;
    }

    setSubmitting(true);
    const transactionId = crypto.randomUUID();

    try {
      // Calculate overall discount distribution
      // Distribute overall discount proportionally across line items
      const overallDiscountNum = parseFloat(overallDiscountValue) || 0;
      let overallDiscountAmount = 0;

      if (overallDiscountType === "percentage" && overallDiscountNum > 0) {
        overallDiscountAmount =
          (subtotalAfterLineDiscounts * overallDiscountNum) / 100;
      } else if (overallDiscountType === "amount" && overallDiscountNum > 0) {
        overallDiscountAmount = overallDiscountNum;
      }

      if (overallDiscountAmount > subtotalAfterLineDiscounts) {
        overallDiscountAmount = subtotalAfterLineDiscounts;
      }

      // ✅ All items should have sufficient stock now (handled above)
      for (const c of computed) {
        if (!c.product || c.quantity <= 0) continue;
        const discount_percentage =
          c.line.discount_type === "percentage"
            ? parseFloat(c.line.discount_value || "0")
            : 0;

        // Calculate this line's share of the overall discount (proportional to its subtotal)
        const lineProportionOfTotal =
          subtotalAfterLineDiscounts > 0
            ? c.final_total / subtotalAfterLineDiscounts
            : 0;
        const lineOverallDiscount =
          overallDiscountAmount * lineProportionOfTotal;

        // Final total for this line after overall discount
        const lineFinalTotal = c.final_total - lineOverallDiscount;

        // Adjust profit to account for overall discount
        const lineFinalProfit = c.profit - lineOverallDiscount;

        const selectedCustomer = customers.find(
          (cust) => cust.id === selectedCustomerId
        );

        const { error: lineError } = await supabase.from("sales").insert({
          transaction_id: transactionId,
          product_id: c.product.id,
          quantity_sold: c.quantity,
          selling_price: c.product.selling_price,
          buying_price: c.product.buying_price,
          total_sale: lineFinalTotal,
          profit: lineFinalProfit,
          payment_method: paymentMethod,
          sold_by: soldBy,
          discount_amount: c.discount_amount + lineOverallDiscount,
          discount_percentage,
          original_price: c.product.selling_price,
          final_price: c.final_unit_price,
          customer_id: selectedCustomerId,
          customer_name: selectedCustomer?.customer_name || "Walk-in Customer",
        });

        if (lineError) throw lineError;

        const newStock = c.product.quantity_in_stock - c.quantity;
        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity_in_stock: newStock })
          .eq("id", c.product.id);
        if (stockError) throw stockError;
      }

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
        total_line_discount,
        overall_discount_type: overallDiscountType,
        overall_discount_value: parseFloat(overallDiscountValue || "0"),
        overall_discount_amount: overallDiscountAmount,
        total,
        total_profit,
      };

      setReceipt(receiptData);

      // ✅ Invalidate caches to update dashboard immediately
      await invalidateAfterSale(queryClient);
    } catch (err) {
      console.error("Error recording multi-product sale:", err);
      alert("Failed to record sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function createPrintHtml(r: ReceiptData) {
    const rows = r.items
      .map(
        (it) => `
          <tr>
            <td>${escapeHtml(it.product_name)}</td>
            <td class="num">${it.quantity}</td>
            <td class="num">KES ${it.unit_price.toLocaleString()}</td>
            <td class="num">${
              it.discount_amount > 0
                ? "-KES " + it.discount_amount.toLocaleString()
                : "-"
            }</td>
            <td class="num">KES ${it.line_total.toLocaleString()}</td>
          </tr>`
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt - HASSAN BOOKSHOP</title>
<style>
  @page { size: A4; margin: 10mm; }
  html, body { height: 100%; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
    color:#000; background:#fff; font-size:12px; line-height:1.35;
    margin:0; padding:0;
  }
  .header { text-align:center; }
  .header h1 { font-size:20px; margin:0 0 2px; letter-spacing:0.5px; }
  .header .sub { font-size:11px; color:#444; }
  .header .title { margin-top:4px; font-size:13px; font-weight:600; }
  .meta { width:100%; border-collapse:collapse; margin-top:10px; font-size:12px; }
  .meta td { padding:2px 0; vertical-align:top; }
  table.items { width:100%; border-collapse:collapse; margin-top:8px; }
  table.items th, table.items td { border:1px solid #222; padding:4px 6px; vertical-align:top; }
  table.items th { background:#f2f2f2; font-weight:600; font-size:11px; }
  .num { text-align:right; }
  tfoot td { font-weight:600; }
  .divider { margin:10px 0; border-top:1px solid #000; }
  .footnote { margin-top:12px; text-align:center; font-size:10px; color:#555; }
  .signature { margin-top:18px; display:flex; justify-content:space-between; gap:16px; }
  .sigbox { width:48%; border-top:1px solid #000; padding-top:4px; text-align:center; font-size:10px; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
  .nowrap { white-space:nowrap; }
</style>
</head>
<body>
  <div class="header">
    <h1>HASSAN BOOKSHOP</h1>
    <div class="sub">Quality Educational Materials & Supplies</div>
    <div class="sub">Tel: +254 722 979 547 Email: yussufh080@gmail.com</div>
    <div class="title">Sales Receipt</div>
  </div>

  <table class="meta">
    <tbody>
      <tr>
        <td><strong>Transaction:</strong> ${r.transactionId}</td>
        <td class="mono nowrap"><strong>Date:</strong> ${r.created_at.toLocaleString()}</td>
      </tr>
      <tr>
        <td><strong>Sold By:</strong> ${escapeHtml(r.sold_by)}</td>
        <td><strong>Payment:</strong> ${escapeHtml(r.payment_method)}</td>
      </tr>
    </tbody>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th style="text-align:left;">Product</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Discount</th>
        <th class="num">Line Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="text-align:right;">Subtotal</td>
        <td class="num">KES ${r.subtotal.toLocaleString()}</td>
      </tr>
      <tr>
        <td colspan="4" style="text-align:right;">Discount</td>
        <td class="num">-KES ${(
          r.total_line_discount + r.overall_discount_amount
        ).toLocaleString()}</td>
      </tr>
      <tr>
        <td colspan="4" style="text-align:right;">Total</td>
        <td class="num">KES ${r.total.toLocaleString()}</td>
      </tr>
    </tfoot>
  </table>

  <div class="divider"></div>

  <div class="signature">
    <div class="sigbox">Customer Signature</div>
    <div class="sigbox">Staff Signature</div>
  </div>

  <div class="footnote">
    Thank you for your purchase. Please keep this receipt for your records.
  </div>
</body>
</html>`;
  }

  function escapeHtml(str: string) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function printReceipt() {
    if (!receipt) return;

    const html = createPrintHtml(receipt);
    const $iframe = document.createElement("iframe");
    $iframe.style.position = "fixed";
    $iframe.style.right = "0";
    $iframe.style.bottom = "0";
    $iframe.style.width = "0";
    $iframe.style.height = "0";
    $iframe.style.border = "0";
    $iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild($iframe);

    const cleanup = () => {
      try {
        document.body.removeChild($iframe);
      } catch {}
    };

    const onReadyToPrint = () => {
      try {
        const win = $iframe.contentWindow;
        if (!win) {
          cleanup();
          alert("Failed to access print frame.");
          return;
        }
        win.focus();
        win.print();
      } catch (e) {
        console.error("Print failed:", e);
        alert("Unable to print. Please try again.");
      } finally {
        setTimeout(cleanup, 500);
      }
    };

    const doc = $iframe.contentWindow?.document;
    if (!doc) {
      cleanup();
      alert("Failed to prepare print frame.");
      return;
    }

    let fired = false;
    const fireOnce = () => {
      if (fired) return;
      fired = true;
      onReadyToPrint();
    };

    $iframe.onload = fireOnce;
    $iframe.contentWindow?.addEventListener("load", fireOnce);

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(fireOnce, 300);
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
    setOverallDiscountType("none");
    setOverallDiscountValue("");
    setReceipt(null);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 touch-pan-y">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl w-full max-w-full sm:max-w-3xl md:max-w-6xl max-h-[95vh] overflow-hidden border border-white/20 animate-scaleIn flex flex-col touch-auto">
        {/* Header - Fixed */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 rounded-t-2xl flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              <div>
                <h3 className="text-lg sm:text-2xl font-black text-white">
                  Record New Sale
                </h3>
                <p className="text-purple-100 text-xs sm:text-sm font-medium">
                  Multi-Product Sale System
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 hover:scale-110 text-white"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Receipt View */}
        {receipt && (
          <div className="p-4 sm:p-6 space-y-6 bg-white/5 backdrop-blur-xl overflow-y-auto flex-1">
            <div className="bg-white text-black rounded-lg border border-gray-300 p-4 sm:p-6 shadow-lg">
              <div className="text-center space-y-1 mb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide">
                  HASSAN BOOKSHOP
                </h1>
                <p className="text-xs text-gray-700">
                  Quality Educational Materials & Supplies
                </p>
                <p className="text-xs text-gray-600">
                  Tel: +254 722 979 547 | Email: yussufh080@gmail.com
                </p>
                <p className="text-sm font-bold mt-2">Sales Receipt</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4 bg-gray-50 p-3 rounded">
                <p>
                  <span className="font-semibold">Transaction:</span>{" "}
                  <span className="text-gray-700">{receipt.transactionId}</span>
                </p>
                <p className="sm:text-right">
                  <span className="font-semibold">Date:</span>{" "}
                  <span className="text-gray-700">
                    {receipt.created_at.toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Sold By:</span>{" "}
                  <span className="text-gray-700">{receipt.sold_by}</span>
                </p>
                <p className="sm:text-right">
                  <span className="font-semibold">Payment:</span>{" "}
                  <span className="text-gray-700">
                    {receipt.payment_method}
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-200 border-b-2 border-gray-400">
                      <th className="px-3 py-2 text-left font-bold">Product</th>
                      <th className="px-3 py-2 text-right font-bold">Qty</th>
                      <th className="px-3 py-2 text-right font-bold">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right font-bold">
                        Discount
                      </th>
                      <th className="px-3 py-2 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {receipt.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{it.product_name}</td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          KES {it.unit_price.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-red-600">
                          {it.discount_amount > 0
                            ? "-" + it.discount_amount.toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          KES {it.line_total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-400">
                    <tr className="bg-gray-50">
                      <td
                        className="px-3 py-2 text-right font-semibold"
                        colSpan={4}
                      >
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        KES {receipt.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    {receipt.total_line_discount > 0 && (
                      <tr className="bg-gray-50">
                        <td
                          className="px-3 py-2 text-right font-semibold"
                          colSpan={4}
                        >
                          Line Discounts
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          -KES {receipt.total_line_discount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {receipt.overall_discount_amount > 0 && (
                      <tr className="bg-gray-50">
                        <td
                          className="px-3 py-2 text-right font-semibold"
                          colSpan={4}
                        >
                          Overall Discount
                          {receipt.overall_discount_type === "percentage" &&
                            ` (${receipt.overall_discount_value}%)`}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                          -KES{" "}
                          {receipt.overall_discount_amount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-800 text-white">
                      <td
                        className="px-3 py-3 text-right font-bold text-base"
                        colSpan={4}
                      >
                        TOTAL
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-base">
                        KES {receipt.total.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-600">
                Thank you for your purchase! Please keep this receipt for your
                records.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={printReceipt}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:from-green-700 hover:to-emerald-700 font-medium shadow-lg"
              >
                <Printer className="w-5 h-5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg"
              >
                New Sale
              </button>
              <button
                onClick={onSuccess}
                className="w-full sm:w-auto px-6 py-3 border-2 border-white/30 text-white rounded-lg hover:bg-white/10 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Entry Form */}
        {!receipt && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto touch-scroll p-4 sm:p-6 space-y-6 bg-white/5 backdrop-blur-xl"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Staff & Payment - Moved to top for better UX */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/30">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Sale Information</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Sold By (Staff) *
                  </label>
                  <select
                    required
                    value={soldBy}
                    onChange={(e) => setSoldBy(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all touch-manipulation relative z-10"
                    style={{ pointerEvents: 'auto' }}
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
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all touch-manipulation"
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
                <div className="relative" ref={customerDropdownRef}>
                  <label className="flex items-center space-x-1 text-sm font-medium text-slate-300 mb-2">
                    <Users className="w-4 h-4" />
                    <span>Customer *</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search or select customer..."
                      className="w-full min-h-[48px] px-4 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-base placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all touch-manipulation"
                      autoComplete="off"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Selected Customer Display */}
                  {(() => {
                    const selected = customers.find(
                      (c) => c.id === selectedCustomerId
                    );
                    return (
                      selected && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {selected.customer_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">
                                  {selected.customer_name}
                                </p>
                                {selected.credit_balance !== 0 && (
                                  <p className={`text-xs ${
                                    selected.credit_balance > 0 
                                      ? 'text-red-400' 
                                      : 'text-green-400'
                                  }`}>
                                    {selected.credit_balance > 0 ? 'Owes: ' : 'Credit: '}
                                    KES {Math.abs(selected.credit_balance).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {selected.id !==
                              "00000000-0000-0000-0000-000000000001" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomerId(
                                    "00000000-0000-0000-0000-000000000001"
                                  );
                                  setCustomerSearch("");
                                }}
                                className="p-1 hover:bg-red-500/20 rounded text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-2xl max-h-80 overflow-y-auto">
                      {(() => {
                        const filtered = customers.filter(
                          (c) =>
                            c.customer_name
                              .toLowerCase()
                              .includes(customerSearch.toLowerCase()) ||
                            (c.phone && c.phone.includes(customerSearch))
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-slate-400">
                              No customers found
                            </div>
                          );
                        }

                        return filtered.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerSearch(customer.customer_name);
                              setShowCustomerDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 ${
                              selectedCustomerId === customer.id
                                ? "bg-purple-500/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                  {customer.customer_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium">
                                    {customer.customer_name}
                                  </p>
                                  {customer.phone && (
                                    <p className="text-xs text-slate-400">
                                      {customer.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {customer.credit_balance !== 0 && (
                                <div className="text-right">
                                  <p className="text-xs text-slate-400">
                                    {customer.credit_balance > 0 ? 'Owes' : 'Credit'}
                                  </p>
                                  <p className={`text-sm font-bold ${
                                    customer.credit_balance > 0 
                                      ? 'text-red-400' 
                                      : 'text-green-400'
                                  }`}>
                                    KES {Math.abs(customer.credit_balance).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Balance Info */}
              {(() => {
                const selectedCustomer = customers.find(
                  (c) => c.id === selectedCustomerId
                );
                if (
                  selectedCustomer &&
                  selectedCustomer.id !== "00000000-0000-0000-0000-000000000001"
                ) {
                  const newBalance = selectedCustomer.credit_balance + total;

                  return (
                    <div className="mt-2 p-4 rounded-xl border bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white text-lg mb-2">
                            {selectedCustomer.customer_name}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-xs text-slate-400">
                                {selectedCustomer.credit_balance > 0 
                                  ? "Owes"
                                  : selectedCustomer.credit_balance < 0
                                  ? "Prepaid Credit"
                                  : "Balance"
                                }
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  selectedCustomer.credit_balance > 0
                                    ? "text-red-400"
                                    : selectedCustomer.credit_balance < 0
                                    ? "text-green-400"
                                    : "text-slate-400"
                                }`}
                              >
                                KES{" "}
                                {Math.abs(selectedCustomer.credit_balance).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-xs text-slate-400">
                                After Sale
                              </p>
                              <p className={`text-lg font-bold ${
                                newBalance > 0 
                                  ? "text-red-400"
                                  : newBalance < 0
                                  ? "text-green-400"
                                  : "text-white"
                              }`}>
                                {newBalance > 0 ? "Owes: " : newBalance < 0 ? "Credit: " : ""}
                                KES {Math.abs(newBalance).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Products ({lineItems.length})</span>
                </h4>
              </div>

              <div className="space-y-3">
                {lineItems.map((li, idx) => {
                  const product = productById(li.product_id);
                  const comp = computed.find((c) => c.line.id === li.id)!;

                  // Get search suggestions (like Google autocomplete)
                  const suggestions =
                    li.searchTerm && li.searchTerm.length >= 2
                      ? getSearchSuggestions(products, li.searchTerm, 8)
                      : [];

                  // Use fuzzy search for better matching (tolerates typos)
                  const searchResults = searchProducts(
                    products,
                    li.searchTerm,
                    {
                      fuzzyThreshold: 0.6, // Lower threshold for more lenient matching
                      includeDescription: true,
                      maxResults: 50,
                    }
                  );
                  const filtered = searchResults.map(
                    (result) => result.product
                  );

                  // Get top selling/featured products for quick access
                  const quickAccessProducts = products
                    .filter((p) => p.featured || p.quantity_in_stock > 0)
                    .slice(0, 5);

                  return (
                    <div
                      key={li.id}
                      ref={(el) => (dropdownRefs.current[li.id] = el)}
                      className="relative bg-white/5 border border-white/20 rounded-xl p-3 sm:p-4 space-y-3 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600/30 text-purple-200 text-xs font-bold">
                            {idx + 1}
                          </span>
                          {product && (
                            <span className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded border border-green-500/30">
                              Stock: {product.quantity_in_stock}
                            </span>
                          )}
                        </div>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(li.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Product Search */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Product *
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                            <input
                              type="text"
                              value={li.searchTerm}
                              required={!li.product_id}
                              onChange={(e) =>
                                updateLine(li.id, {
                                  searchTerm: e.target.value,
                                  showDropdown: true,
                                  product_id: e.target.value
                                    ? li.product_id
                                    : "",
                                })
                              }
                              onFocus={() =>
                                updateLine(li.id, { showDropdown: true })
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                updateLine(li.id, { showDropdown: true });
                              }}
                              placeholder="Start typing to search products..."
                              className="w-full pl-9 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                              autoComplete="off"
                            />

                            {/* Predictive Suggestions Dropdown - Google Style */}
                            {li.showDropdown && (
                              <div className="absolute z-30 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
                                {/* Quick Access - When search is empty */}
                                {!li.searchTerm &&
                                  quickAccessProducts.length > 0 && (
                                    <div className="border-b border-white/10">
                                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Quick Access</span>
                                      </div>
                                      {quickAccessProducts.map((p) => (
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
                                          className="w-full text-left px-3 py-2 hover:bg-purple-600/20 text-sm flex items-center space-x-2 transition-colors"
                                        >
                                          {p.image_url ? (
                                            <img
                                              src={p.image_url}
                                              alt={p.name}
                                              className="w-8 h-8 object-cover rounded border border-white/10"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/10">
                                              <Package className="w-4 h-4 text-slate-400" />
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-white text-xs truncate">
                                              {p.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                              KES{" "}
                                              {p.selling_price.toLocaleString()}
                                            </p>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                {/* Search Suggestions - Like Google */}
                                {suggestions.length > 0 && li.searchTerm && (
                                  <div className="border-b border-white/10">
                                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                                      <Search className="w-3 h-3" />
                                      <span>Suggestions</span>
                                    </div>
                                    {suggestions.map((suggestion, idx) => {
                                      // Find matching product for suggestion
                                      products.find(
                                        (p) =>
                                          p.name === suggestion ||
                                          p.category === suggestion
                                      );
                                      return (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() =>
                                            updateLine(li.id, {
                                              searchTerm: suggestion,
                                              showDropdown: true,
                                            })
                                          }
                                          className="w-full text-left px-3 py-2 hover:bg-purple-600/20 text-sm flex items-center space-x-2 transition-colors group"
                                        >
                                          <Clock className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                                          <span className="text-white">
                                            {suggestion
                                              .split(
                                                new RegExp(
                                                  `(${li.searchTerm})`,
                                                  "gi"
                                                )
                                              )
                                              .map((part, i) =>
                                                part.toLowerCase() ===
                                                li.searchTerm.toLowerCase() ? (
                                                  <span
                                                    key={i}
                                                    className="font-bold text-purple-300"
                                                  >
                                                    {part}
                                                  </span>
                                                ) : (
                                                  <span key={i}>{part}</span>
                                                )
                                              )}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Full Product Results */}
                                {li.searchTerm && filtered.length > 0 && (
                                  <div>
                                    {suggestions.length > 0 && (
                                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                                        <Package className="w-3 h-3" />
                                        <span>
                                          Products ({filtered.length})
                                        </span>
                                      </div>
                                    )}
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
                                        className="w-full text-left px-3 py-2.5 hover:bg-purple-600/20 text-sm flex items-center space-x-2 transition-colors border-b border-white/5 last:border-0"
                                      >
                                        {p.image_url ? (
                                          <img
                                            src={p.image_url}
                                            alt={p.name}
                                            className="w-10 h-10 object-cover rounded border border-white/10"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center border border-white/10">
                                            <Package className="w-5 h-5 text-slate-400" />
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
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
                                      <div className="px-3 py-2 text-xs text-center text-slate-400 bg-slate-900/50">
                                        + {filtered.length - 15} more results
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* No Results */}
                                {li.searchTerm && filtered.length === 0 && (
                                  <div className="p-4 text-center text-slate-400 text-sm">
                                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                    <p className="font-medium">
                                      No products found
                                    </p>
                                    <p className="text-xs mt-1">
                                      Try a different search term
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={li.quantity}
                            onChange={(e) =>
                              updateLine(li.id, { quantity: e.target.value })
                            }
                            className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Qty"
                          />
                        </div>

                        {/* Discount Type */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                            className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                              Percentage (%)
                            </option>
                            <option
                              value="amount"
                              className="bg-slate-900 text-white"
                            >
                              Amount (KES)
                            </option>
                          </select>
                        </div>

                        {/* Discount Value */}
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                              li.discount_type === "percentage"
                                ? 100
                                : undefined
                            }
                            step={
                              li.discount_type === "percentage" ? "0.01" : "1"
                            }
                            className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            placeholder={
                              li.discount_type === "percentage" ? "10" : "100"
                            }
                          />
                        </div>
                      </div>

                      {/* Line Summary */}
                      {product && comp.quantity > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2 pt-3 border-t border-white/10">
                          <div className="bg-blue-500/10 rounded-md p-2 border border-blue-500/20">
                            <span className="text-slate-400 block mb-0.5">
                              Original
                            </span>
                            <span className="font-bold text-blue-300">
                              KES {comp.original_total.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-red-500/10 rounded-md p-2 border border-red-500/20">
                            <span className="text-slate-400 block mb-0.5">
                              Discount
                            </span>
                            <span className="font-bold text-red-300">
                              {comp.discount_amount > 0
                                ? "-" + comp.discount_amount.toLocaleString()
                                : "-"}
                            </span>
                          </div>
                          <div className="bg-purple-500/10 rounded-md p-2 border border-purple-500/20">
                            <span className="text-slate-400 block mb-0.5">
                              Line Total
                            </span>
                            <span className="font-bold text-purple-300">
                              KES {comp.final_total.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-green-500/10 rounded-md p-2 border border-green-500/20">
                            <span className="text-slate-400 block mb-0.5">
                              Profit Est.
                            </span>
                            <span className="font-bold text-green-300">
                              KES {comp.profit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Line Button - NOW AT THE BOTTOM */}
              <button
                type="button"
                onClick={addLine}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Another Product Line</span>
              </button>
            </div>

            {/* Overall Discount Section */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/30">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                <span>🎁</span>
                <span>Overall Discount (Applied to Total)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={overallDiscountType}
                    onChange={(e) => {
                      setOverallDiscountType(e.target.value as DiscountType);
                      setOverallDiscountValue("");
                    }}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  >
                    <option value="none" className="bg-slate-900 text-white">
                      No Overall Discount
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    disabled={overallDiscountType === "none"}
                    value={overallDiscountValue}
                    onChange={(e) => setOverallDiscountValue(e.target.value)}
                    min="0"
                    max={overallDiscountType === "percentage" ? 100 : undefined}
                    step={overallDiscountType === "percentage" ? "0.01" : "1"}
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    placeholder={
                      overallDiscountType === "percentage"
                        ? "e.g., 10 for 10%"
                        : "e.g., 500 for KES 500"
                    }
                  />
                </div>
              </div>
            </div>

            {/* Overall Totals */}
            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-purple-500/40 space-y-3 shadow-lg">
              <h4 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
                <span>💵</span>
                <span>Sale Summary</span>
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Subtotal:</span>
                  <span className="font-semibold text-white">
                    KES {subtotal.toLocaleString()}
                  </span>
                </div>
                {total_line_discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Line Discounts:</span>
                    <span className="font-semibold text-red-400">
                      -KES {total_line_discount.toLocaleString()}
                    </span>
                  </div>
                )}
                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      Overall Discount
                      {overallDiscountType === "percentage" &&
                        ` (${overallDiscountValue}%)`}
                      :
                    </span>
                    <span className="font-semibold text-red-400">
                      -KES {overallDiscountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg border-t border-white/20 pt-3 font-bold">
                  <span className="text-purple-300">Final Total:</span>
                  <span className="text-purple-300">
                    KES {total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-slate-300">Estimated Profit:</span>
                  <span className="font-bold text-green-400">
                    KES {total_profit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Improved for mobile touch */}
            <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[48px] px-6 py-3 border-2 border-white/30 text-white rounded-lg hover:bg-white/10 transition-all font-medium touch-manipulation active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base touch-manipulation active:scale-95"
              >
                {submitting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Recording Sale...</span>
                  </span>
                ) : (
                  "Complete Sale"
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stock Receive Modal */}
      <StockReceiveModal
        isOpen={showStockModal}
        item={currentStockItem}
        onReceiveStock={handleReceiveStock}
        onSkipItem={handleSkipItem}
        onCancel={handleCancelSale}
      />
    </div>
  );
}
