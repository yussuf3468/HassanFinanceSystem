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
} from "lucide-react";
import { searchProducts } from "../utils/searchUtils";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
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
  customer_name: string;
  payment_status: string;
  amount_paid: number;
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
const staffMembers = ["Khalid", "Yussuf", "Zakaria"];

export default function SaleForm({
  products,
  onClose,
  onSuccess,
}: SaleFormProps) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [soldBy, setSoldBy] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "not_paid" | "partial"
  >("paid");
  const [amountPaid, setAmountPaid] = useState("");
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

  // Quick Sale Mode - Skip payment method selection
  const [quickSaleMode, setQuickSaleMode] = useState(false);

  // Sale Drafts
  const [showDrafts, setShowDrafts] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<
    Array<{
      id: string;
      name: string;
      timestamp: Date;
      lineItems: LineItem[];
      soldBy: string;
      paymentMethod: string;
      overallDiscountType: DiscountType;
      overallDiscountValue: string;
      customerName?: string;
      paymentStatus?: string;
      amountPaid?: string;
    }>
  >([]);

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Quick Add Product Modal
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");
  const [quickProductBuyingPrice, setQuickProductBuyingPrice] = useState("");
  const [quickProductSellingPrice, setQuickProductSellingPrice] = useState("");

  // Barcode Scanner Mode
  const [barcodeScannerMode, setBarcodeScannerMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

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
  const firstProductSearchRef = useRef<HTMLInputElement | null>(null);

  // Keyboard shortcuts for faster operations
  useEffect(() => {
    function handleKeyboardShortcuts(e: KeyboardEvent) {
      // F1-F3 for quick staff selection
      if (e.key === "F1" && !quickSaleMode) {
        e.preventDefault();
        setSoldBy("Khalid");
      } else if (e.key === "F2" && !quickSaleMode) {
        e.preventDefault();
        setSoldBy("Yussuf");
      } else if (e.key === "F3" && !quickSaleMode) {
        e.preventDefault();
        setSoldBy("Zakaria");
      }
      // Ctrl+Enter to submit form quickly
      else if (e.ctrlKey && e.key === "Enter" && !submitting && soldBy) {
        e.preventDefault();
        const form = document.querySelector("form");
        if (form) {
          form.dispatchEvent(
            new Event("submit", { cancelable: true, bubbles: true }),
          );
        }
      }
      // Ctrl+B to toggle barcode scanner mode
      else if (e.ctrlKey && e.key === "b" && !receipt) {
        e.preventDefault();
        setBarcodeScannerMode(!barcodeScannerMode);
      }
    }

    document.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      document.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [quickSaleMode, submitting, soldBy, barcodeScannerMode, receipt]);

  // Auto-focus on first product search input when form opens
  useEffect(() => {
    if (!receipt && firstProductSearchRef.current) {
      setTimeout(() => {
        firstProductSearchRef.current?.focus();
      }, 300);
    }
  }, [receipt]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      setLineItems((items) =>
        items.map((li) => {
          const ref = dropdownRefs.current[li.id];
          if (ref && !ref.contains(target)) {
            return { ...li, showDropdown: false };
          }
          return li;
        }),
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
    // Check for duplicate products when setting a product_id
    if (patch.product_id && patch.product_id.trim() !== "") {
      const isDuplicate = lineItems.some(
        (li) => li.id !== id && li.product_id === patch.product_id,
      );

      if (isDuplicate) {
        const product = products.find((p) => p.id === patch.product_id);
        alert(
          `⚠️ "${
            product?.name || "This product"
          }" is already added to this sale!\n\nPlease update the quantity on the existing line instead of adding it again.`,
        );
        return;
      }
    }

    setLineItems((items) =>
      items.map((li) => (li.id === id ? { ...li, ...patch } : li)),
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

  // Load drafts from database on mount
  useEffect(() => {
    async function loadDrafts() {
      try {
        const { data, error } = await supabase
          .from("sale_drafts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setSavedDrafts(
            data.map((d: any) => ({
              id: d.id,
              name: d.draft_name,
              timestamp: new Date(d.created_at),
              lineItems: d.line_items,
              soldBy: d.sold_by,
              paymentMethod: d.payment_method,
              overallDiscountType: d.overall_discount_type,
              overallDiscountValue: d.overall_discount_value,
              customerName: d.customer_name,
              paymentStatus: d.payment_status,
              amountPaid: d.amount_paid,
            })),
          );
        }
      } catch (e) {
        console.error("Failed to load drafts:", e);
      }
    }
    loadDrafts();
  }, []);

  async function saveDraft() {
    const draftName = prompt(
      "Enter a name for this draft:",
      `Sale ${new Date().toLocaleTimeString()}`,
    );
    if (!draftName) return;

    try {
      const { data, error } = await supabase
        .from("sale_drafts")
        .insert({
          draft_name: draftName,
          line_items: lineItems,
          sold_by: soldBy,
          payment_method: paymentMethod,
          overall_discount_type: overallDiscountType,
          overall_discount_value: overallDiscountValue
            ? parseFloat(overallDiscountValue)
            : null,
          customer_name: customerName || null,
          payment_status: paymentStatus,
          amount_paid: amountPaid ? parseFloat(amountPaid) : null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newDraft = {
          id: data.id,
          name: data.draft_name,
          timestamp: new Date(data.created_at),
          lineItems: data.line_items,
          soldBy: data.sold_by,
          paymentMethod: data.payment_method,
          overallDiscountType: data.overall_discount_type,
          overallDiscountValue: data.overall_discount_value,
          customerName: data.customer_name,
          paymentStatus: data.payment_status,
          amountPaid: data.amount_paid,
        };
        setSavedDrafts([newDraft, ...savedDrafts]);
        alert(`✅ Draft "${draftName}" saved!`);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again.");
    }
  }

  function loadDraft(draft: (typeof savedDrafts)[0]) {
    if (!confirm(`Load draft "${draft.name}"? Current sale will be replaced.`))
      return;

    setLineItems(draft.lineItems);
    setSoldBy(draft.soldBy);
    setPaymentMethod(draft.paymentMethod);
    setOverallDiscountType(draft.overallDiscountType);
    setOverallDiscountValue(draft.overallDiscountValue);
    setCustomerName(draft.customerName || "");
    setPaymentStatus(
      (draft.paymentStatus as "paid" | "not_paid" | "partial") || "paid",
    );
    setAmountPaid(draft.amountPaid || "");
    setShowDrafts(false);
  }

  async function deleteDraft(draftId: string) {
    try {
      const { error } = await supabase
        .from("sale_drafts")
        .delete()
        .eq("id", draftId);

      if (error) throw error;

      const updated = savedDrafts.filter((d) => d.id !== draftId);
      setSavedDrafts(updated);
    } catch (error) {
      console.error("Error deleting draft:", error);
      alert("Failed to delete draft. Please try again.");
    }
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
    0,
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
        },
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
              new Event("submit", { cancelable: true, bubbles: true }),
            );
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert(
        `Failed to update stock for ${currentStockItem.product.name}. Please try again.`,
      );
    }
  }

  function handleSkipItem() {
    // Remove this item from the sale
    if (!currentStockItem) return;

    // Remove line items for this product
    setLineItems((items) =>
      items.filter((li) => li.product_id !== currentStockItem.product.id),
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
            new Event("submit", { cancelable: true, bubbles: true }),
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

    // Validate payment status and amount paid
    if (paymentStatus === "partial") {
      if (!amountPaid || parseFloat(amountPaid) <= 0) {
        alert("Please enter the amount paid for partial payment.");
        return;
      }
      if (parseFloat(amountPaid) >= total) {
        alert(
          "Partial payment amount must be less than the total amount. Please select 'Paid' if paying in full.",
        );
        return;
      }
    }

    // Auto-fill amount paid if not specified
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      setAmountPaid(total.toString());
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
      // ✅ All items should have sufficient stock now (handled above)
      // Calculate how to distribute the overall discount proportionally
      const totalBeforeOverallDiscount = computed.reduce(
        (sum, c) => sum + c.final_total,
        0,
      );

      for (const c of computed) {
        if (!c.product || c.quantity <= 0) continue;
        const discount_percentage =
          c.line.discount_type === "percentage"
            ? parseFloat(c.line.discount_value || "0")
            : 0;

        // Calculate this line's proportional share of the overall discount
        const lineProportionOfTotal =
          totalBeforeOverallDiscount > 0
            ? c.final_total / totalBeforeOverallDiscount
            : 0;
        const lineShareOfOverallDiscount =
          overallDiscountAmount * lineProportionOfTotal;

        // Apply the overall discount to this line's total and profit
        const lineFinalTotal = c.final_total - lineShareOfOverallDiscount;
        const lineFinalProfit = c.profit - lineShareOfOverallDiscount;

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
          customer_name: customerName || "Walk-in Customer",
          payment_status: paymentStatus,
          amount_paid: parseFloat(amountPaid) || total,
          discount_amount: c.discount_amount,
          discount_percentage,
          original_price: c.product.selling_price,
          final_price: c.final_unit_price,
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
        customer_name: customerName || "Walk-in Customer",
        payment_status: paymentStatus,
        amount_paid: parseFloat(amountPaid) || total,
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
          </tr>`,
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
  table.items tbody { page-break-inside: auto; }
  table.items tbody tr { page-break-inside: avoid; page-break-after: auto; }
  .num { text-align:right; }
  
  /* Prevent tfoot from repeating on each page */
  table.items tfoot { 
    display: table-footer-group;
    page-break-inside: avoid;
    page-break-before: auto;
  }
  tfoot td { font-weight:600; }
  
  /* Keep summary section together on last page */
  .summary-section {
    page-break-inside: avoid;
  }
  
  .divider { margin:10px 0; border-top:1px solid #000; }
  .footnote { margin-top:12px; text-align:center; font-size:10px; color:#555; }
  .signature { margin-top:18px; display:flex; justify-content:space-between; gap:16px; page-break-inside: avoid; }
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
        <td><strong>Customer:</strong> ${escapeHtml(r.customer_name)}</td>
        <td><strong>Payment:</strong> ${escapeHtml(r.payment_method)}</td>
      </tr>
      <tr>
        <td><strong>Sold By:</strong> ${escapeHtml(r.sold_by)}</td>
        <td><strong>Payment Status:</strong> ${escapeHtml(
          r.payment_status.replace("_", " ").toUpperCase(),
        )}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Amount Paid:</strong> KES ${r.amount_paid.toLocaleString()}</td>
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
  </table>

  <div class="summary-section">
    <table class="items" style="margin-top: 0; border-top: none;">
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

  function printDraft(draft: (typeof savedDrafts)[0]) {
    // Convert draft to receipt format
    const draftItems = draft.lineItems
      .map((li) => {
        const product = productById(li.product_id);
        if (!product) return null;

        const quantity = parseInt(li.quantity || "0") || 0;
        const sellingPrice = product.selling_price;
        const originalTotal = quantity * sellingPrice;

        let discountAmount = 0;
        if (li.discount_type === "percentage" && li.discount_value) {
          const pct = parseFloat(li.discount_value) || 0;
          discountAmount = (originalTotal * pct) / 100;
        } else if (li.discount_type === "fixed" && li.discount_value) {
          discountAmount = parseFloat(li.discount_value) || 0;
        }

        const lineTotal = originalTotal - discountAmount;
        const finalUnitPrice =
          quantity > 0 ? lineTotal / quantity : sellingPrice;
        const buyingPrice = product.buying_price;
        const profit = (finalUnitPrice - buyingPrice) * quantity;

        return {
          product_name: product.name,
          quantity,
          unit_price: sellingPrice,
          original_total: originalTotal,
          discount_amount: discountAmount,
          final_unit_price: finalUnitPrice,
          line_total: lineTotal,
          profit,
        };
      })
      .filter((item) => item !== null);

    const subtotal = draftItems.reduce(
      (sum, item) => sum + item.original_total,
      0,
    );
    const totalLineDiscount = draftItems.reduce(
      (sum, item) => sum + item.discount_amount,
      0,
    );

    let overallDiscountAmount = 0;
    const afterLineDiscounts = subtotal - totalLineDiscount;
    if (
      draft.overallDiscountType === "percentage" &&
      draft.overallDiscountValue
    ) {
      const pct = parseFloat(draft.overallDiscountValue) || 0;
      overallDiscountAmount = (afterLineDiscounts * pct) / 100;
    } else if (
      draft.overallDiscountType === "fixed" &&
      draft.overallDiscountValue
    ) {
      overallDiscountAmount = parseFloat(draft.overallDiscountValue) || 0;
    }

    const total = afterLineDiscounts - overallDiscountAmount;
    const totalProfit = draftItems.reduce((sum, item) => sum + item.profit, 0);

    const receiptData: ReceiptData = {
      transactionId: `DRAFT-${draft.id.substring(0, 8).toUpperCase()}`,
      sold_by: draft.soldBy || "N/A",
      payment_method: draft.paymentMethod || "N/A",
      customer_name: draft.customerName || "Walk-in Customer",
      payment_status: draft.paymentStatus || "paid",
      amount_paid: parseFloat(draft.amountPaid || String(total)),
      created_at: draft.timestamp,
      items: draftItems,
      subtotal,
      total_line_discount: totalLineDiscount,
      overall_discount_type: draft.overallDiscountType,
      overall_discount_value: parseFloat(draft.overallDiscountValue) || 0,
      overall_discount_amount: overallDiscountAmount,
      total,
      total_profit: totalProfit,
    };

    // Use the same print logic
    const html = createPrintHtml(receiptData);
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
    setCustomerName("");
    setPaymentStatus("paid");
    setAmountPaid("");
    setReceipt(null);
  }

  async function handleQuickAddProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!quickProductName.trim()) return;

    const buyingPrice = parseFloat(quickProductBuyingPrice) || 0;
    const sellingPrice = parseFloat(quickProductSellingPrice) || 0;

    if (sellingPrice <= 0) {
      alert("Please enter a valid selling price greater than 0.");
      return;
    }

    try {
      // Generate a product ID
      const productId = `PROD-${Date.now()}`;

      const { data, error } = await supabase
        .from("products")
        .insert({
          product_id: productId,
          name: quickProductName.trim(),
          category: "Other",
          buying_price: buyingPrice,
          selling_price: sellingPrice,
          quantity_in_stock: 0,
          reorder_level: 5,
          description: "Added during sale",
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Refresh products list
        await queryClient.invalidateQueries({ queryKey: ["products"] });

        // Add the new product to the current sale
        setLineItems((items) => [
          ...items.filter((li) => li.product_id !== ""),
          {
            id: crypto.randomUUID(),
            product_id: data.id,
            quantity: "1",
            discount_type: "none",
            discount_value: "",
            searchTerm: data.name,
            showDropdown: false,
          },
        ]);

        alert(
          `✅ Product "${
            data.name
          }" added successfully!\nBuying: KES ${buyingPrice.toLocaleString()}\nSelling: KES ${sellingPrice.toLocaleString()}`,
        );
        setShowQuickAddProduct(false);
        setQuickProductName("");
        setQuickProductBuyingPrice("");
        setQuickProductSellingPrice("");
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 touch-pan-y">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-full sm:max-w-3xl md:max-w-6xl max-h-[98vh] overflow-hidden border border-slate-300 dark:border-slate-700 flex flex-col touch-auto">
        {/* Header - Fixed */}
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 flex-shrink-0 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  New Sale
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Point of Sale System
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt View */}
        {receipt && (
          <div className="p-4 sm:p-6 space-y-6 bg-white dark:bg-slate-800 overflow-y-auto flex-1">
            <div className="bg-white dark:bg-slate-700 text-black dark:text-white rounded-xl border border-gray-300 dark:border-slate-600 p-4 sm:p-6 shadow-lg">
              <div className="text-center space-y-1 mb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                  HASSAN BOOKSHOP
                </h1>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  Quality Educational Materials & Supplies
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tel: +254 722 979 547 | Email: yussufh080@gmail.com
                </p>
                <p className="text-sm font-bold mt-2 text-slate-900 dark:text-white">
                  Sales Receipt
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4 bg-gray-50 dark:bg-slate-600 p-3 rounded">
                <p>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Transaction:
                  </span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {receipt.transactionId}
                  </span>
                </p>
                <p className="sm:text-right">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Date:
                  </span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {receipt.created_at.toLocaleString()}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Sold By:
                  </span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {receipt.sold_by}
                  </span>
                </p>
                <p className="sm:text-right">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Payment:
                  </span>{" "}
                  <span className="text-gray-700 dark:text-gray-300">
                    {receipt.payment_method}
                  </span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-slate-600 border-b-2 border-gray-400 dark:border-slate-500">
                      <th className="px-3 py-2 text-left font-bold text-slate-900 dark:text-white">
                        Product
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                        Discount
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                    {receipt.items.map((it, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 dark:hover:bg-slate-600 text-slate-900 dark:text-white"
                      >
                        <td className="px-3 py-2">{it.product_name}</td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">
                          KES {it.unit_price.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-rose-700 dark:text-rose-400">
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
                  <tfoot className="border-t-2 border-gray-400 dark:border-slate-500">
                    <tr className="bg-gray-50 dark:bg-slate-600">
                      <td
                        className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white"
                        colSpan={4}
                      >
                        Subtotal
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                        KES {receipt.subtotal.toLocaleString()}
                      </td>
                    </tr>
                    {receipt.total_line_discount > 0 && (
                      <tr className="bg-gray-50 dark:bg-slate-600">
                        <td
                          className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white"
                          colSpan={4}
                        >
                          Line Discounts
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-700 dark:text-rose-400">
                          -KES {receipt.total_line_discount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    {receipt.overall_discount_amount > 0 && (
                      <tr className="bg-gray-50 dark:bg-slate-600">
                        <td
                          className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white"
                          colSpan={4}
                        >
                          Overall Discount
                          {receipt.overall_discount_type === "percentage" &&
                            ` (${receipt.overall_discount_value}%)`}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-rose-700 dark:text-rose-400">
                          -KES{" "}
                          {receipt.overall_discount_amount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-800 dark:bg-slate-900 text-white">
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

              <div className="mt-6 pt-4 border-t border-gray-300 dark:border-slate-600 text-center text-[10px] text-gray-600 dark:text-gray-400">
                Thank you for your purchase! Please keep this receipt for your
                records.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={printReceipt}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl flex items-center justify-center space-x-2 hover:bg-emerald-700 font-medium shadow-lg"
              >
                <Printer className="w-5 h-5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 dark:bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-700 font-medium shadow-sm"
              >
                New Sale
              </button>
              <button
                onClick={onSuccess}
                className="w-full sm:w-auto px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
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
            className="flex-1 overflow-y-auto touch-scroll p-3 bg-slate-50 dark:bg-slate-900"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* Keyboard Shortcuts Help Banner - Full Width */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 mb-3">
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Shortcuts:
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F1
                  </kbd>{" "}
                  Khalid
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F2
                  </kbd>{" "}
                  Yussuf
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    F3
                  </kbd>{" "}
                  Zakaria
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-mono">
                    Ctrl+↵
                  </kbd>{" "}
                  Submit
                </span>
              </div>
            </div>

            {/* Barcode Scanner Mode */}
            {barcodeScannerMode && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Barcode Scanner Mode Active
                      </p>
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Scan or type product ID and press Enter
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBarcodeScannerMode(false)}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    Exit
                  </button>
                </div>
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && barcodeInput.trim()) {
                      e.preventDefault();
                      // Find product by product_id
                      const product = products.find(
                        (p) =>
                          p.product_id.toLowerCase() ===
                          barcodeInput.trim().toLowerCase(),
                      );
                      if (product) {
                        // Check if already in sale
                        const existingLine = lineItems.find(
                          (li) => li.product_id === product.id,
                        );
                        if (existingLine) {
                          // Increment quantity
                          updateLine(existingLine.id, {
                            quantity: String(
                              parseInt(existingLine.quantity || "1") + 1,
                            ),
                          });
                        } else {
                          // Add new line
                          const emptyLine = lineItems.find(
                            (li) => li.product_id === "",
                          );
                          if (emptyLine) {
                            updateLine(emptyLine.id, {
                              product_id: product.id,
                              searchTerm: product.name,
                              quantity: "1",
                              showDropdown: false,
                            });
                          } else {
                            setLineItems((items) => [
                              ...items,
                              {
                                id: crypto.randomUUID(),
                                product_id: product.id,
                                quantity: "1",
                                discount_type: "none",
                                discount_value: "",
                                searchTerm: product.name,
                                showDropdown: false,
                              },
                            ]);
                          }
                        }
                        setBarcodeInput("");
                        // Play success sound (optional)
                        const audio = new Audio(
                          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZjzkJGWS36+iebBAAUKXh8LljHgU2jNXwzn0vBSl+zPDZkUELEmCz6OqnWBUIRJze8cBlJAUrgc/y2ow6ChljuOvpn20RAlGl4PG5ZB8GM4/W8c1+MAUofsrw2JBCC",
                        );
                        audio.volume = 0.3;
                        audio.play().catch(() => {});
                      } else {
                        alert(
                          `❌ Product with ID "${barcodeInput}" not found!`,
                        );
                        setBarcodeInput("");
                      }
                    }
                  }}
                  placeholder="Scan or type product ID here..."
                  autoFocus
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-purple-300 dark:border-purple-600 rounded-xl text-slate-800 dark:text-white text-lg font-mono focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 focus:border-purple-500 dark:focus:border-purple-600 transition-all"
                />
              </div>
            )}

            {/* Quick Sale Mode Toggle */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Quick Sale Mode
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Skip payment selection for faster checkout
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickSaleMode(!quickSaleMode);
                  if (!quickSaleMode) {
                    setSoldBy("Khalid");
                    setPaymentMethod("Till Number");
                  }
                }}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation active:scale-95 ${
                  quickSaleMode ? "bg-green-600" : "bg-gray-600"
                }`}
                style={{ WebkitTapHighlightColor: "rgba(34,197,94,0.3)" }}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    quickSaleMode ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
              {/* LEFT COLUMN - Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600">
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Products</span>
                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                      {lineItems.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-2">
                  {lineItems.map((li, idx) => {
                    const product = productById(li.product_id);
                    const comp = computed.find((c) => c.line.id === li.id)!;
                    // Use advanced search with fuzzy matching
                    const searchResults = searchProducts(
                      products,
                      li.searchTerm,
                      {
                        fuzzyThreshold: 0.6, // More lenient (0.6 instead of default 0.7)
                        includeDescription: false,
                        maxResults: 15,
                      },
                    );

                    const filtered = searchResults.map(
                      (result) => result.product,
                    );

                    // Get best prediction for autocomplete (first result)
                    const prediction =
                      filtered.length > 0 && li.searchTerm
                        ? filtered[0].name
                        : "";

                    // Calculate autocomplete suggestion
                    const autocompleteSuggestion =
                      prediction &&
                      prediction
                        .toLowerCase()
                        .startsWith(li.searchTerm.toLowerCase())
                        ? li.searchTerm + prediction.slice(li.searchTerm.length)
                        : "";

                    // Handle keyboard navigation
                    const handleSearchKeyDown = (
                      e: React.KeyboardEvent<HTMLInputElement>,
                    ) => {
                      if (e.key === "Tab" && autocompleteSuggestion) {
                        e.preventDefault();
                        updateLine(li.id, {
                          searchTerm: autocompleteSuggestion,
                          showDropdown: true,
                        });
                      } else if (e.key === "Enter" && filtered.length > 0) {
                        e.preventDefault();
                        updateLine(li.id, {
                          product_id: filtered[0].id,
                          searchTerm: filtered[0].name,
                          showDropdown: false,
                        });
                      } else if (e.key === "Escape") {
                        updateLine(li.id, { showDropdown: false });
                      }
                    };

                    // Quick Access - Top selling or featured products
                    const quickAccessProducts = products
                      .filter((p) => p.quantity_in_stock > 0)
                      .sort(
                        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0),
                      )
                      .slice(0, 5);

                    // Generate suggestions like Google (product names and categories)
                    const suggestions: string[] = [];
                    if (li.searchTerm) {
                      const searchLower = li.searchTerm.toLowerCase();
                      const uniqueSuggestions = new Set<string>();

                      // Add matching product names
                      products.forEach((p) => {
                        if (
                          p.name.toLowerCase().includes(searchLower) &&
                          p.name.toLowerCase() !== searchLower
                        ) {
                          uniqueSuggestions.add(p.name);
                        }
                      });

                      // Add matching categories
                      products.forEach((p) => {
                        if (
                          p.category.toLowerCase().includes(searchLower) &&
                          p.category.toLowerCase() !== searchLower
                        ) {
                          uniqueSuggestions.add(p.category);
                        }
                      });

                      suggestions.push(
                        ...Array.from(uniqueSuggestions).slice(0, 3),
                      );
                    }

                    return (
                      <div
                        key={li.id}
                        ref={(el) => (dropdownRefs.current[li.id] = el)}
                        className="relative bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium text-xs">
                              {idx + 1}
                            </span>
                            {product && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-700">
                                Stock: {product.quantity_in_stock}
                              </span>
                            )}
                          </div>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(li.id)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 transition-colors"
                              title="Remove line"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                          {/* Product Search */}
                          <div className="sm:col-span-2">
                            <label className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              <span className="mr-2">🔍</span>
                              Product *{" "}
                              {autocompleteSuggestion && (
                                <span className="text-amber-700 dark:text-amber-400 font-semibold text-xs ml-2 animate-pulse">
                                  Press Tab ↹ to complete
                                </span>
                              )}
                            </label>
                            <div className="relative group">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-800 pointer-events-none z-10 transition-all group-focus-within:text-amber-800 group-focus-within:scale-110" />

                              {/* Autocomplete preview (ghost text) */}
                              {autocompleteSuggestion && li.showDropdown && (
                                <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none z-[5] text-sm text-slate-700 dark:text-slate-300 font-medium">
                                  {autocompleteSuggestion}
                                </div>
                              )}

                              <input
                                type="text"
                                ref={
                                  idx === 0 ? firstProductSearchRef : undefined
                                }
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
                                onKeyDown={handleSearchKeyDown}
                                onFocus={() =>
                                  updateLine(li.id, { showDropdown: true })
                                }
                                placeholder="Type to search products..."
                                className="w-full pl-10 pr-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all relative z-10 font-medium hover:border-slate-400 dark:hover:border-slate-500 touch-manipulation"
                                style={{ background: "transparent" }}
                              />

                              {/* Predictive Suggestions Dropdown - Google Style */}
                              {li.showDropdown && (
                                <div className="absolute z-30 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                                  {/* Quick Access - When search is empty */}
                                  {!li.searchTerm &&
                                    quickAccessProducts.length > 0 && (
                                      <div className="border-b border-amber-100/50 dark:border-slate-700">
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
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
                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center space-x-2 transition-colors"
                                          >
                                            {p.image_url ? (
                                              <img
                                                src={p.image_url}
                                                alt={p.name}
                                                className="w-8 h-8 object-cover rounded border border-amber-100/50 dark:border-slate-700"
                                              />
                                            ) : (
                                              <div className="w-8 h-8 bg-white/90 dark:bg-slate-700/90 rounded flex items-center justify-center border border-amber-100/50 dark:border-slate-600">
                                                <Package className="w-4 h-4 text-slate-700 dark:text-slate-300 " />
                                              </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                              <p className="font-medium text-slate-900 dark:text-white text-xs truncate">
                                                {p.name}
                                              </p>
                                              <p className="text-xs text-slate-700 dark:text-slate-300 ">
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
                                    <div className="border-b border-amber-100/50 dark:border-slate-700">
                                      <div className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                                        <Search className="w-3 h-3" />
                                        <span>Suggestions</span>
                                      </div>
                                      {suggestions.map((suggestion, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() =>
                                            updateLine(li.id, {
                                              searchTerm: suggestion,
                                              showDropdown: true,
                                            })
                                          }
                                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center space-x-2 transition-colors group"
                                        >
                                          <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400" />
                                          <span className="text-white">
                                            {suggestion
                                              .split(
                                                new RegExp(
                                                  `(${li.searchTerm})`,
                                                  "gi",
                                                ),
                                              )
                                              .map((part, i) =>
                                                part.toLowerCase() ===
                                                li.searchTerm.toLowerCase() ? (
                                                  <span
                                                    key={i}
                                                    className="font-bold text-amber-700 dark:text-amber-400 "
                                                  >
                                                    {part}
                                                  </span>
                                                ) : (
                                                  <span key={i}>{part}</span>
                                                ),
                                              )}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Full Product Results */}
                                  {li.searchTerm && filtered.length > 0 && (
                                    <div>
                                      {suggestions.length > 0 && (
                                        <div className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
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
                                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm flex items-center space-x-2 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        >
                                          {p.image_url ? (
                                            <img
                                              src={p.image_url}
                                              alt={p.name}
                                              className="w-10 h-10 object-cover rounded border border-amber-100/50 dark:border-slate-700"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 bg-white/90 dark:bg-slate-700/90 rounded flex items-center justify-center border border-amber-100/50 dark:border-slate-600">
                                              <Package className="w-5 h-5 text-slate-700 dark:text-slate-300 " />
                                            </div>
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                              {p.name}
                                            </p>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                              {p.product_id} • Stock{" "}
                                              {p.quantity_in_stock} • KES{" "}
                                              {p.selling_price.toLocaleString()}
                                            </p>
                                          </div>
                                        </button>
                                      ))}
                                      {filtered.length > 15 && (
                                        <div className="px-3 py-2 text-xs text-center text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700">
                                          + {filtered.length - 15} more results
                                        </div>
                                      )}

                                      {/* Quick Add Product Button - Always Show at Bottom */}
                                      <div className="border-t-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-3">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickProductName(li.searchTerm);
                                            setShowQuickAddProduct(true);
                                            updateLine(li.id, {
                                              showDropdown: false,
                                            });
                                          }}
                                          className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
                                        >
                                          <Plus className="w-5 h-5" />
                                          <span>
                                            Product Not Here? Add "
                                            {li.searchTerm}" to Inventory
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* No Results */}
                                  {li.searchTerm && filtered.length === 0 && (
                                    <div className="p-4 space-y-3">
                                      {/* Add Product Button at Top */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickProductName(li.searchTerm);
                                          setShowQuickAddProduct(true);
                                          updateLine(li.id, {
                                            showDropdown: false,
                                          });
                                        }}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center space-x-2 border-2 border-green-500"
                                      >
                                        <Plus className="w-5 h-5" />
                                        <span>
                                          Add "{li.searchTerm}" to Inventory
                                        </span>
                                      </button>

                                      {/* No Results Message */}
                                      <div className="text-center text-slate-700 dark:text-slate-300 text-sm">
                                        <Search className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                                        <p className="font-medium">
                                          No products found
                                        </p>
                                        <p className="text-xs mt-1">
                                          Product not in inventory? Click button
                                          above to add it
                                        </p>
                                      </div>

                                      {/* Duplicate Add Button at Bottom for convenience */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickProductName(li.searchTerm);
                                          setShowQuickAddProduct(true);
                                          updateLine(li.id, {
                                            showDropdown: false,
                                          });
                                        }}
                                        className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center justify-center space-x-2"
                                      >
                                        <Plus className="w-4 h-4" />
                                        <span>
                                          Add "{li.searchTerm}" to Inventory
                                        </span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                              Quantity *
                            </label>
                            <div className="space-y-2">
                              <input
                                type="number"
                                min={1}
                                value={li.quantity}
                                onChange={(e) =>
                                  updateLine(li.id, {
                                    quantity: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                                placeholder="Qty"
                              />
                              {/* Quick Quantity Buttons */}
                              <div className="grid grid-cols-5 gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(
                                      li.quantity || "1",
                                    );
                                    updateLine(li.id, {
                                      quantity: String(
                                        Math.max(1, current - 1),
                                      ),
                                    });
                                  }}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
                                  style={{
                                    touchAction: "manipulation",
                                    WebkitTapHighlightColor:
                                      "rgba(139, 92, 246, 0.3)",
                                  }}
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(
                                      li.quantity || "1",
                                    );
                                    updateLine(li.id, {
                                      quantity: String(current + 1),
                                    });
                                  }}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
                                  style={{
                                    touchAction: "manipulation",
                                    WebkitTapHighlightColor:
                                      "rgba(139, 92, 246, 0.3)",
                                  }}
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(
                                      li.quantity || "1",
                                    );
                                    updateLine(li.id, {
                                      quantity: String(current * 2),
                                    });
                                  }}
                                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded text-xs text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
                                  style={{
                                    touchAction: "manipulation",
                                    WebkitTapHighlightColor:
                                      "rgba(139, 92, 246, 0.3)",
                                  }}
                                >
                                  ×2
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(
                                      li.quantity || "1",
                                    );
                                    updateLine(li.id, {
                                      quantity: String(current * 5),
                                    });
                                  }}
                                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded text-xs text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
                                  style={{
                                    touchAction: "manipulation",
                                    WebkitTapHighlightColor:
                                      "rgba(139, 92, 246, 0.3)",
                                  }}
                                >
                                  ×5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = parseInt(
                                      li.quantity || "1",
                                    );
                                    updateLine(li.id, {
                                      quantity: String(current * 10),
                                    });
                                  }}
                                  className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 rounded text-xs text-emerald-700 dark:text-emerald-400 font-medium transition-colors"
                                  style={{
                                    touchAction: "manipulation",
                                    WebkitTapHighlightColor:
                                      "rgba(139, 92, 246, 0.3)",
                                  }}
                                >
                                  ×10
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Discount Type */}
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 transition-all"
                            >
                              <option
                                value="none"
                                className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                              >
                                None
                              </option>
                              <option
                                value="percentage"
                                className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                              >
                                Percentage (%)
                              </option>
                              <option
                                value="amount"
                                className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                              >
                                Amount (KES)
                              </option>
                            </select>
                          </div>

                          {/* Discount Value */}
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                              className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              placeholder={
                                li.discount_type === "percentage" ? "10" : "100"
                              }
                            />
                          </div>
                        </div>

                        {/* Line Summary */}
                        {product && comp.quantity > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-2 border border-slate-200 dark:border-slate-700">
                              <span className="text-slate-600 dark:text-slate-400 block mb-0.5">
                                Original
                              </span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                KES {comp.original_total.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-2 border border-red-200 dark:border-red-800">
                              <span className="text-slate-700 dark:text-slate-300 block mb-0.5">
                                Discount
                              </span>
                              <span className="font-bold text-red-600 dark:text-red-400">
                                {comp.discount_amount > 0
                                  ? "-" + comp.discount_amount.toLocaleString()
                                  : "-"}
                              </span>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-md p-2 border border-emerald-200 dark:border-emerald-700">
                              <span className="text-slate-600 dark:text-slate-400 block mb-0.5">
                                Line Total
                              </span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                KES {comp.final_total.toLocaleString()}
                              </span>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2 border border-emerald-200 dark:border-emerald-700">
                              <span className="text-slate-700 dark:text-slate-300 block mb-0.5">
                                Profit Est.
                              </span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                KES {comp.profit.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Line Button */}
                <button
                  type="button"
                  onClick={addLine}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product Line</span>
                </button>

                {/* Staff & Payment - Sale Information */}
                {!quickSaleMode && (
                  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-600 shadow-lg mt-3">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-600">
                      <span className="text-lg">📋</span>
                      <span>Sale Information</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Sold By (Staff) *
                        </label>
                        <select
                          required
                          value={soldBy}
                          onChange={(e) => setSoldBy(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                        >
                          <option
                            value=""
                            className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                          >
                            -- Select Staff Member --
                          </option>
                          {staffMembers.map((s) => (
                            <option
                              key={s}
                              value={s}
                              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Payment Method *
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                        >
                          {paymentMethods.map((m) => (
                            <option
                              key={m}
                              value={m}
                              className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                            >
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Customer Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Customer Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                          placeholder="Walk-in Customer"
                        />
                      </div>

                      {/* Payment Status */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                          Payment Status *
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={(e) =>
                            setPaymentStatus(
                              e.target.value as "paid" | "not_paid" | "partial",
                            )
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                        >
                          <option value="paid">Paid</option>
                          <option value="partial">Partial Payment</option>
                          <option value="not_paid">Not Paid</option>
                        </select>
                      </div>

                      {/* Amount Paid - Only show for partial payment */}
                      {paymentStatus === "partial" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Amount Paid *
                          </label>
                          <input
                            type="number"
                            value={amountPaid}
                            onChange={(e) => setAmountPaid(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-600 transition-all"
                            placeholder="Enter amount paid"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* End LEFT COLUMN */}

              {/* RIGHT COLUMN - Discount, Summary, Actions */}
              <div className="space-y-3">
                {/* Quick Mode Info Banner */}
                {quickSaleMode && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-4 flex items-center space-x-3 shadow-lg">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-500 dark:bg-emerald-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                        Quick Sale Mode
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Till Number • Khalid
                      </p>
                    </div>
                  </div>
                )}

                {/* Overall Discount Section */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-5 border-2 border-slate-200 dark:border-slate-600 shadow-lg">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center space-x-2 pb-3 border-b border-slate-200 dark:border-slate-600">
                    <span className="text-lg">🏷️</span>
                    <span>Discount</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                        Discount Type
                      </label>
                      <select
                        value={overallDiscountType}
                        onChange={(e) => {
                          setOverallDiscountType(
                            e.target.value as DiscountType,
                          );
                          setOverallDiscountValue("");
                        }}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option
                          value="none"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          No Overall Discount
                        </option>
                        <option
                          value="percentage"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          Percentage (%)
                        </option>
                        <option
                          value="amount"
                          className="bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        >
                          Fixed Amount (KES)
                        </option>
                      </select>
                    </div>
                    {overallDiscountType !== "none" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          Discount Value
                        </label>
                        <input
                          type="number"
                          value={overallDiscountValue}
                          onChange={(e) =>
                            setOverallDiscountValue(e.target.value)
                          }
                          min="0"
                          max={
                            overallDiscountType === "percentage"
                              ? 100
                              : undefined
                          }
                          step={
                            overallDiscountType === "percentage" ? "0.01" : "1"
                          }
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          placeholder={
                            overallDiscountType === "percentage"
                              ? "e.g., 10 for 10%"
                              : "e.g., 500 for KES 500"
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Totals */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-5 border-2 border-emerald-200 dark:border-emerald-700 shadow-lg">
                  <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200 mb-4 flex items-center space-x-2 pb-3 border-b border-emerald-200 dark:border-emerald-700">
                    <span className="text-lg">💰</span>
                    <span>Summary</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        Subtotal
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        KES {subtotal.toLocaleString()}
                      </span>
                    </div>
                    {total_line_discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Line Discounts
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          -KES {total_line_discount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {overallDiscountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Overall Discount
                          {overallDiscountType === "percentage" &&
                            ` (${overallDiscountValue}%)`}
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          -KES {overallDiscountAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t-2 border-emerald-300 dark:border-emerald-600 pt-4 mt-2">
                      <span className="text-emerald-800 dark:text-emerald-200">
                        Total Amount
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300">
                        KES {total.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-emerald-100 dark:border-emerald-900">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Estimated Profit
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        KES {total_profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDrafts(!showDrafts)}
                    className="w-full sm:w-auto px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Drafts ({savedDrafts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="w-full sm:w-auto px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow"
                  >
                    <span>💾</span>
                    <span>Save Draft</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all text-sm font-medium shadow-sm hover:shadow"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 text-white rounded-lg transition-all disabled:cursor-not-allowed font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
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
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Complete Sale"
                    )}
                  </button>
                </div>
              </div>
              {/* End RIGHT COLUMN */}
            </div>
            {/* End Two Column Layout */}
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

      {/* Quick Add Product Modal */}
      {showQuickAddProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-900/50 dark:to-emerald-800 p-4 sm:p-6 rounded-t-2xl border-b-2 border-green-400 dark:border-emerald-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Quick Add Product
                    </h3>
                    <p className="text-green-50 text-xs sm:text-sm font-medium">
                      Add missing product to inventory
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuickAddProduct(false);
                    setQuickProductName("");
                    setQuickProductBuyingPrice("");
                    setQuickProductSellingPrice("");
                  }}
                  className="p-2 bg-white/20 dark:bg-slate-700/40 hover:bg-white/30 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-300 hover:scale-110 text-white border border-white/30 dark:border-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleQuickAddProduct} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-3">
                <p className="text-xs text-blue-800 dark:text-blue-400">
                  ⚡ <strong>Quick Add:</strong> Product will be added with
                  stock quantity of 0. The sale will proceed and stock will be
                  deducted. You can receive stock and update other details later
                  in inventory management.
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  placeholder="Enter product name..."
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-green-500 dark:focus:border-green-600 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Buying Price (KES)
                  </label>
                  <input
                    type="number"
                    value={quickProductBuyingPrice}
                    onChange={(e) => setQuickProductBuyingPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Selling Price (KES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={quickProductSellingPrice}
                    onChange={(e) =>
                      setQuickProductSellingPrice(e.target.value)
                    }
                    placeholder="0"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-green-500 dark:focus:border-green-600 transition-all"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAddProduct(false);
                    setQuickProductName("");
                    setQuickProductBuyingPrice("");
                    setQuickProductSellingPrice("");
                  }}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drafts Panel Modal */}
      {showDrafts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Saved Drafts
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {savedDrafts.length} draft
                    {savedDrafts.length !== 1 ? "s" : ""} saved
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDrafts(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                style={{
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "rgba(139, 92, 246, 0.3)",
                }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drafts List */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              {savedDrafts.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block opacity-50">📭</span>
                  <p className="text-slate-400">No saved drafts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-600 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white truncate mb-1">
                            {draft.name}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-700 dark:text-slate-300 mb-3">
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {new Date(draft.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                              </svg>
                              {draft.lineItems.length} item
                              {draft.lineItems.length !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              {draft.soldBy}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                              </svg>
                              {draft.paymentMethod}
                            </span>
                          </div>
                          {/* Line Items Preview */}
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-1 border border-slate-200 dark:border-slate-600">
                            {draft.lineItems.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-slate-700 dark:text-slate-300 flex justify-between"
                              >
                                <span className="truncate flex-1">
                                  {products.find(
                                    (p) => p.id === item.product_id,
                                  )?.name || "Unknown"}
                                </span>
                                <span className="text-slate-700 dark:text-slate-300 ml-2">
                                  ×{item.quantity}
                                </span>
                              </div>
                            ))}
                            {draft.lineItems.length > 3 && (
                              <div className="text-xs text-slate-700 dark:text-slate-300 italic">
                                +{draft.lineItems.length - 3} more item
                                {draft.lineItems.length - 3 !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2 whitespace-nowrap min-h-[44px]"
                            style={{
                              touchAction: "manipulation",
                              WebkitTapHighlightColor:
                                "rgba(139, 92, 246, 0.3)",
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            Load
                          </button>
                          <button
                            onClick={() => {
                              printDraft(draft);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2 whitespace-nowrap min-h-[44px]"
                            style={{
                              touchAction: "manipulation",
                              WebkitTapHighlightColor:
                                "rgba(139, 92, 246, 0.3)",
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                              />
                            </svg>
                            Print
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete draft "${draft.name}"?`)) {
                                deleteDraft(draft.id);
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-medium text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2 whitespace-nowrap min-h-[44px]"
                            style={{
                              touchAction: "manipulation",
                              WebkitTapHighlightColor:
                                "rgba(139, 92, 246, 0.3)",
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
