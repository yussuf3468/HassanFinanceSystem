import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Search,
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Tag,
  Save,
  Inbox,
  Zap,
  Keyboard,
} from "lucide-react";
import { searchProducts } from "../utils/searchUtils";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSaleDrafts,
  createSaleDraft,
  deleteSaleDraft,
  createSale,
  processStockReceipt,
} from "../api/salesApi";
import { createProduct, updateProductStock } from "../api/productsApi";
import type { Product } from "../types";
import { invalidateAfterSale } from "../utils/cacheInvalidation";
import { StockReceiveModal } from "./StockReceiveModal";
import POSReceipt, { type ReceiptData } from "./POSReceipt";

interface POSSaleFormProps {
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

type DiscountType = "none" | "percentage" | "amount";
type PaymentStatus = "paid" | "partial" | "not_paid";

interface CartItem {
  product: Product;
  quantity: number;
  discount_type: DiscountType;
  discount_value: number;
}

const PAYMENT_METHODS = ["Cash", "Mpesa", "Till Number", "Card", "Bank Transfer"];
const STAFF_MEMBERS = ["Khalid", "Yussuf", "Zakaria"];

const LS_CASHIER = "pos.cashier";
const LS_PAYMENT = "pos.payment";

export default function POSSaleForm({
  products,
  onClose,
  onSuccess,
}: POSSaleFormProps) {
  const queryClient = useQueryClient();

  // === Persistent staff/payment defaults ===
  const [soldBy, setSoldBy] = useState<string>(
    () => localStorage.getItem(LS_CASHIER) || "Khalid",
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    () => localStorage.getItem(LS_PAYMENT) || "Till Number",
  );

  useEffect(() => {
    localStorage.setItem(LS_CASHIER, soldBy);
  }, [soldBy]);
  useEffect(() => {
    localStorage.setItem(LS_PAYMENT, paymentMethod);
  }, [paymentMethod]);

  // === Cart state ===
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeDiscountLineId, setActiveDiscountLineId] = useState<string | null>(null);

  // === Optional extras (collapsed) ===
  const [showExtras, setShowExtras] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [overallDiscountType, setOverallDiscountType] = useState<DiscountType>("none");
  const [overallDiscountValue, setOverallDiscountValue] = useState("");

  // === Modals / overlays ===
  const [showDrafts, setShowDrafts] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [quickProductName, setQuickProductName] = useState("");
  const [quickProductBuying, setQuickProductBuying] = useState("");
  const [quickProductSelling, setQuickProductSelling] = useState("");

  // === Stock-receive flow ===
  const [showStockModal, setShowStockModal] = useState(false);
  const [pendingStockItems, setPendingStockItems] = useState<
    Array<{ product: Product; requested: number; available: number; shortage: number }>
  >([]);
  const currentStockItem = pendingStockItems[0] ?? null;

  // === Drafts ===
  type Draft = {
    id: string;
    name: string;
    timestamp: Date;
    cart: CartItem[];
    soldBy: string;
    paymentMethod: string;
    customerName: string;
    paymentStatus: PaymentStatus;
    amountPaid: string;
    overallDiscountType: DiscountType;
    overallDiscountValue: string;
  };
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // === Submit ===
  const [submitting, setSubmitting] = useState(false);

  // === Receipt ===
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus search on open
  useEffect(() => {
    if (!receipt) {
      const t = setTimeout(() => searchRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [receipt]);

  // Load drafts
  useEffect(() => {
    (async () => {
      try {
        const data = await getSaleDrafts();
        if (!data) return;
        setDrafts(
          data.map((d: any) => ({
            id: d.id,
            name: d.draft_name,
            timestamp: new Date(d.created_at),
            cart: hydrateDraftCart(d.line_items, products),
            soldBy: d.sold_by,
            paymentMethod: d.payment_method,
            customerName: d.customer_name || "",
            paymentStatus: (d.payment_status as PaymentStatus) || "paid",
            amountPaid: d.amount_paid != null ? String(d.amount_paid) : "",
            overallDiscountType: (d.overall_discount_type as DiscountType) || "none",
            overallDiscountValue:
              d.overall_discount_value != null ? String(d.overall_discount_value) : "",
          })),
        );
      } catch (e) {
        console.error("Failed to load drafts:", e);
      }
    })();
  }, [products]);

  function hydrateDraftCart(lineItems: any[], productList: Product[]): CartItem[] {
    if (!Array.isArray(lineItems)) return [];
    return lineItems
      .map((li) => {
        const product = productList.find((p) => p.id === li.product_id);
        if (!product) return null;
        return {
          product,
          quantity: parseInt(li.quantity || "1") || 1,
          discount_type: (li.discount_type as DiscountType) || "none",
          discount_value: parseFloat(li.discount_value || "0") || 0,
        };
      })
      .filter((c): c is CartItem => c !== null);
  }

  // === Search results (limit to keep grid snappy) ===
  const searchResults = useMemo(() => {
    if (!search.trim()) {
      // No search → show most relevant: in-stock + featured first
      return [...products]
        .filter((p) => p.quantity_in_stock > 0)
        .sort((a, b) => {
          const af = a.featured ? 1 : 0;
          const bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 48);
    }
    return searchProducts(products, search, {
      fuzzyThreshold: 0.5,
      includeDescription: false,
      maxResults: 48,
    }).map((r) => r.product);
  }, [products, search]);

  // === Cart math ===
  const computed = useMemo(() => {
    return cart.map((line) => {
      const original_total = line.product.selling_price * line.quantity;
      let discount_amount = 0;
      if (line.discount_type === "percentage" && line.discount_value > 0) {
        discount_amount = (original_total * line.discount_value) / 100;
      } else if (line.discount_type === "amount" && line.discount_value > 0) {
        discount_amount = line.discount_value;
      }
      if (discount_amount > original_total) discount_amount = original_total;
      const final_total = original_total - discount_amount;
      const final_unit_price = line.quantity > 0 ? final_total / line.quantity : 0;
      const profit = (final_unit_price - line.product.buying_price) * line.quantity;
      return { line, original_total, discount_amount, final_total, final_unit_price, profit };
    });
  }, [cart]);

  const subtotal = computed.reduce((s, c) => s + c.original_total, 0);
  const lineDiscountTotal = computed.reduce((s, c) => s + c.discount_amount, 0);
  const afterLineDiscounts = subtotal - lineDiscountTotal;

  const overallDiscountNum = parseFloat(overallDiscountValue) || 0;
  let overallDiscountAmount = 0;
  if (overallDiscountType === "percentage" && overallDiscountNum > 0) {
    overallDiscountAmount = (afterLineDiscounts * overallDiscountNum) / 100;
  } else if (overallDiscountType === "amount" && overallDiscountNum > 0) {
    overallDiscountAmount = overallDiscountNum;
  }
  if (overallDiscountAmount > afterLineDiscounts) overallDiscountAmount = afterLineDiscounts;

  const total = afterLineDiscounts - overallDiscountAmount;
  const totalProfit =
    computed.reduce((s, c) => s + c.profit, 0) - overallDiscountAmount;
  const totalDiscount = lineDiscountTotal + overallDiscountAmount;
  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);

  // === Cart actions ===
  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart((curr) => {
      const idx = curr.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const next = [...curr];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...curr,
        { product, quantity: qty, discount_type: "none", discount_value: 0 },
      ];
    });
  }, []);

  const changeQty = useCallback((productId: string, qty: number) => {
    setCart((curr) =>
      curr
        .map((c) => (c.product.id === productId ? { ...c, quantity: qty } : c))
        .filter((c) => c.quantity > 0),
    );
  }, []);

  const incQty = (productId: string) => {
    setCart((curr) =>
      curr.map((c) =>
        c.product.id === productId ? { ...c, quantity: c.quantity + 1 } : c,
      ),
    );
  };

  const decQty = (productId: string) => {
    setCart((curr) =>
      curr
        .map((c) =>
          c.product.id === productId ? { ...c, quantity: c.quantity - 1 } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((curr) => curr.filter((c) => c.product.id !== productId));
  };

  const setLineDiscount = (
    productId: string,
    type: DiscountType,
    value: number,
  ) => {
    setCart((curr) =>
      curr.map((c) =>
        c.product.id === productId
          ? { ...c, discount_type: type, discount_value: value }
          : c,
      ),
    );
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Clear all items from the cart?")) setCart([]);
  };

  // === Keyboard shortcuts ===
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't trap typing in inputs except for Ctrl+Enter / F-keys
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "F1") {
        e.preventDefault();
        setSoldBy("Khalid");
      } else if (e.key === "F2") {
        e.preventDefault();
        setSoldBy("Yussuf");
      } else if (e.key === "F3") {
        e.preventDefault();
        setSoldBy("Zakaria");
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (cart.length > 0 && !submitting) handleCharge();
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "Escape") {
        if (activeDiscountLineId) {
          setActiveDiscountLineId(null);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, submitting, activeDiscountLineId, showShortcuts]);

  // === Stock receive flow ===
  function validateStock(): Array<{
    product: Product;
    requested: number;
    available: number;
    shortage: number;
  }> {
    const aggregate: Record<string, number> = {};
    for (const c of cart) {
      aggregate[c.product.id] = (aggregate[c.product.id] || 0) + c.quantity;
    }
    const out: Array<{
      product: Product;
      requested: number;
      available: number;
      shortage: number;
    }> = [];
    for (const [pid, q] of Object.entries(aggregate)) {
      const prod = cart.find((c) => c.product.id === pid)!.product;
      if (q > prod.quantity_in_stock) {
        out.push({
          product: prod,
          requested: q,
          available: prod.quantity_in_stock,
          shortage: q - prod.quantity_in_stock,
        });
      }
    }
    return out;
  }

  async function handleReceiveStock(quantity: number, source: string) {
    if (!currentStockItem) return;
    try {
      const item = currentStockItem;
      const newStock = item.product.quantity_in_stock + quantity;
      await updateProductStock(item.product.id, newStock);
      try {
        await processStockReceipt({
          product_id: item.product.id,
          quantity,
          received_by: soldBy,
          notes: source,
        });
      } catch (err) {
        console.error("Stock receipt trail error:", err);
      }
      // Mutate local product reference so subsequent validation passes
      item.product.quantity_in_stock = newStock;
      const next = pendingStockItems.slice(1);
      setPendingStockItems(next);
      if (next.length === 0) {
        setShowStockModal(false);
        setTimeout(() => handleCharge(), 50);
      }
    } catch (err) {
      console.error("Error updating stock:", err);
      alert(`Failed to update stock for ${currentStockItem.product.name}.`);
    }
  }

  function handleSkipStockItem() {
    if (!currentStockItem) return;
    removeFromCart(currentStockItem.product.id);
    const next = pendingStockItems.slice(1);
    setPendingStockItems(next);
    if (next.length === 0) {
      setShowStockModal(false);
      setTimeout(() => handleCharge(), 50);
    }
  }

  function handleCancelStock() {
    setShowStockModal(false);
    setPendingStockItems([]);
  }

  // === Charge / submit sale ===
  async function handleCharge() {
    if (cart.length === 0) return;
    if (!soldBy) {
      alert("Please pick a cashier.");
      return;
    }

    if (paymentStatus === "partial") {
      const ap = parseFloat(amountPaid);
      if (!ap || ap <= 0) {
        alert("Enter the amount paid for partial payment.");
        return;
      }
      if (ap >= total) {
        alert("Partial amount must be less than the total. Change status to Paid.");
        return;
      }
    }

    const shortages = validateStock();
    if (shortages.length > 0) {
      setPendingStockItems(shortages);
      setShowStockModal(true);
      return;
    }

    setSubmitting(true);
    const transactionId = crypto.randomUUID();
    const totalBeforeOverall = computed.reduce((s, c) => s + c.final_total, 0);
    const finalAmountPaid =
      paymentStatus === "paid"
        ? total
        : paymentStatus === "not_paid"
          ? 0
          : parseFloat(amountPaid) || 0;

    try {
      for (const c of computed) {
        const lineProp =
          totalBeforeOverall > 0 ? c.final_total / totalBeforeOverall : 0;
        const lineShareOfOverall = overallDiscountAmount * lineProp;
        const lineFinalTotal = c.final_total - lineShareOfOverall;
        const lineFinalProfit = c.profit - lineShareOfOverall;
        const discount_percentage =
          c.line.discount_type === "percentage" ? c.line.discount_value : 0;

        await createSale({
          transaction_id: transactionId,
          product_id: c.line.product.id,
          quantity_sold: c.line.quantity,
          selling_price: c.line.product.selling_price,
          buying_price: c.line.product.buying_price,
          total_sale: lineFinalTotal,
          profit: lineFinalProfit,
          payment_method: paymentMethod,
          sold_by: soldBy,
          customer_name: customerName || "Walk-in Customer",
          payment_status: paymentStatus,
          amount_paid: finalAmountPaid,
          discount_amount: c.discount_amount,
          discount_percentage,
          original_price: c.line.product.selling_price,
          final_price: c.final_unit_price,
        });

        const newStock = c.line.product.quantity_in_stock - c.line.quantity;
        await updateProductStock(c.line.product.id, newStock);
      }

      const receiptData: ReceiptData = {
        transactionId,
        sold_by: soldBy,
        payment_method: paymentMethod,
        customer_name: customerName || "Walk-in Customer",
        payment_status: paymentStatus,
        amount_paid: finalAmountPaid,
        created_at: new Date(),
        items: computed.map((c) => ({
          product_name: c.line.product.name,
          product_id: c.line.product.product_id,
          quantity: c.line.quantity,
          unit_price: c.line.product.selling_price,
          original_total: c.original_total,
          discount_amount: c.discount_amount,
          final_unit_price: c.final_unit_price,
          line_total: c.final_total,
          profit: c.profit,
        })),
        subtotal,
        total_line_discount: lineDiscountTotal,
        overall_discount_type: overallDiscountType,
        overall_discount_value: overallDiscountNum,
        overall_discount_amount: overallDiscountAmount,
        total,
        total_profit: totalProfit,
        balance_due: total - finalAmountPaid,
      };

      setReceipt(receiptData);
      await invalidateAfterSale(queryClient);
    } catch (err) {
      console.error("Error recording sale:", err);
      alert("Failed to record sale. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewSale() {
    setCart([]);
    setCustomerName("");
    setPaymentStatus("paid");
    setAmountPaid("");
    setOverallDiscountType("none");
    setOverallDiscountValue("");
    setSearch("");
    setReceipt(null);
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  // === Drafts ===
  async function handleSaveDraft() {
    if (cart.length === 0) return;
    const name = prompt(
      "Name this draft:",
      `Sale ${new Date().toLocaleTimeString()}`,
    );
    if (!name) return;
    try {
      const data: any = await createSaleDraft({
        draft_name: name,
        line_items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: String(c.quantity),
          discount_type: c.discount_type,
          discount_value: String(c.discount_value),
        })),
        sold_by: soldBy,
        payment_method: paymentMethod,
        overall_discount_type: overallDiscountType,
        overall_discount_value:
          overallDiscountValue ? parseFloat(overallDiscountValue) : null,
        customer_name: customerName || null,
        payment_status: paymentStatus,
        amount_paid: amountPaid ? parseFloat(amountPaid) : null,
      });
      if (data) {
        setDrafts((d) => [
          {
            id: data.id,
            name: data.draft_name,
            timestamp: new Date(data.created_at),
            cart: [...cart],
            soldBy,
            paymentMethod,
            customerName,
            paymentStatus,
            amountPaid,
            overallDiscountType,
            overallDiscountValue,
          },
          ...d,
        ]);
      }
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Failed to save draft.");
    }
  }

  function handleLoadDraft(d: Draft) {
    setCart(d.cart);
    setSoldBy(d.soldBy);
    setPaymentMethod(d.paymentMethod);
    setCustomerName(d.customerName);
    setPaymentStatus(d.paymentStatus);
    setAmountPaid(d.amountPaid);
    setOverallDiscountType(d.overallDiscountType);
    setOverallDiscountValue(d.overallDiscountValue);
    setShowDrafts(false);
  }

  async function handleDeleteDraft(id: string) {
    try {
      await deleteSaleDraft(id);
      setDrafts((d) => d.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("Failed to delete draft.");
    }
  }

  // === Quick add product ===
  async function handleQuickAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickProductName.trim()) return;
    const sellingPrice = parseFloat(quickProductSelling) || 0;
    if (sellingPrice <= 0) {
      alert("Selling price must be greater than 0.");
      return;
    }
    const buyingPrice = parseFloat(quickProductBuying) || 0;
    try {
      const productId = `PROD-${Date.now()}`;
      const created = await createProduct({
        product_id: productId,
        name: quickProductName.trim(),
        category: "Other",
        image_url: null,
        buying_price: buyingPrice,
        selling_price: sellingPrice,
        quantity_in_stock: 0,
        reorder_level: 5,
        description: "Added during sale",
      });
      if (created) {
        await queryClient.invalidateQueries({ queryKey: ["products"] });
        addToCart(created as Product, 1);
        setShowQuickAdd(false);
        setQuickProductName("");
        setQuickProductBuying("");
        setQuickProductSelling("");
      }
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Failed to add product.");
    }
  }

  // ============================================================
  // RECEIPT VIEW
  // ============================================================
  if (receipt) {
    return (
      <POSReceipt
        receipt={receipt}
        onNewSale={startNewSale}
        onClose={() => {
          setReceipt(null);
          onSuccess();
        }}
      />
    );
  }

  // ============================================================
  // POS LAYOUT
  // ============================================================
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-stretch sm:items-center justify-center sm:p-3">
      <div className="bg-slate-50 dark:bg-slate-900 w-full h-full sm:h-[96vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Point of Sale
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Hassan Bookshop · {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cashier dropdown */}
            <label className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <User className="w-3.5 h-3.5" />
              Cashier
            </label>
            <select
              value={soldBy}
              onChange={(e) => setSoldBy(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
              title="F1/F2/F3 to switch cashier"
            >
              {STAFF_MEMBERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowDrafts(true)}
              className="h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1.5"
              title="Saved drafts"
            >
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">
                Drafts {drafts.length > 0 && `(${drafts.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 hidden sm:flex items-center justify-center"
              title="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-300 flex items-center justify-center"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ===== BODY ===== */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] overflow-hidden">
          {/* ----- LEFT: Product picker ----- */}
          <section className="flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-700">
            <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      e.preventDefault();
                      addToCart(searchResults[0]);
                      setSearch("");
                    }
                  }}
                  placeholder="Search products (press / to focus)…"
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/30 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuickProductName(search);
                  setShowQuickAdd(true);
                }}
                className="h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium flex items-center gap-1.5"
                title="Add a product not in inventory"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No products match "{search}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickProductName(search);
                      setShowQuickAdd(true);
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add "{search}" to inventory
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {searchResults.map((p) => {
                    const inCart = cart.find((c) => c.product.id === p.id);
                    const oos = p.quantity_in_stock <= 0;
                    const low =
                      !oos && p.quantity_in_stock <= (p.reorder_level || 5);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addToCart(p)}
                        className={`group relative text-left bg-white dark:bg-slate-800 rounded-xl border-2 transition-all overflow-hidden ${
                          inCart
                            ? "border-emerald-500 shadow-md shadow-emerald-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-lg"
                        } ${oos ? "opacity-60" : ""}`}
                      >
                        <div className="aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-10 h-10 text-slate-400" />
                          )}
                        </div>
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg">
                            {inCart.quantity}
                          </span>
                        )}
                        {oos && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase">
                            Out
                          </span>
                        )}
                        {low && !oos && (
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold uppercase">
                            Low
                          </span>
                        )}
                        <div className="p-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight min-h-[2.2em]">
                            {p.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {p.selling_price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {p.quantity_in_stock} left
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ----- RIGHT: Cart ----- */}
          <section className="flex flex-col bg-white dark:bg-slate-800 overflow-hidden">
            {/* Cart header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Sale
              </h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 px-4">
                  <ShoppingCart className="w-14 h-14 mb-3 opacity-40" />
                  <p className="font-medium text-slate-600 dark:text-slate-400">
                    Cart is empty
                  </p>
                  <p className="text-xs mt-1">
                    Click any product on the left to add it
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {computed.map((c) => {
                    const showDisc = activeDiscountLineId === c.line.product.id;
                    return (
                      <div
                        key={c.line.product.id}
                        className="group bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {c.line.product.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              KES {c.line.product.selling_price.toLocaleString()} each
                              {c.discount_amount > 0 && (
                                <span className="ml-1 text-rose-600 dark:text-rose-400 font-medium">
                                  · −{c.discount_amount.toLocaleString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              KES {c.final_total.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2 gap-2">
                          {/* qty stepper */}
                          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                            <button
                              type="button"
                              onClick={() => decQty(c.line.product.id)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-l-lg"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={c.line.quantity}
                              onChange={(e) =>
                                changeQty(
                                  c.line.product.id,
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-12 h-7 text-center text-sm font-bold text-slate-900 dark:text-white bg-transparent border-x border-slate-200 dark:border-slate-600 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => incQty(c.line.product.id)}
                              className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-r-lg"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveDiscountLineId(
                                  showDisc ? null : c.line.product.id,
                                )
                              }
                              className={`h-7 px-2 rounded text-[11px] font-medium flex items-center gap-1 ${
                                c.line.discount_type !== "none"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                              }`}
                              title="Apply line discount"
                            >
                              <Tag className="w-3 h-3" />
                              {c.line.discount_type !== "none"
                                ? c.line.discount_type === "percentage"
                                  ? `${c.line.discount_value}%`
                                  : `−${c.line.discount_value}`
                                : "Disc"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(c.line.product.id)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {showDisc && (
                          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 grid grid-cols-3 gap-1.5">
                            <select
                              value={c.line.discount_type}
                              onChange={(e) =>
                                setLineDiscount(
                                  c.line.product.id,
                                  e.target.value as DiscountType,
                                  c.line.discount_value,
                                )
                              }
                              className="col-span-1 h-8 px-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                            >
                              <option value="none">No discount</option>
                              <option value="percentage">%</option>
                              <option value="amount">KES</option>
                            </select>
                            <input
                              type="number"
                              min={0}
                              max={c.line.discount_type === "percentage" ? 100 : undefined}
                              value={c.line.discount_value || ""}
                              onChange={(e) =>
                                setLineDiscount(
                                  c.line.product.id,
                                  c.line.discount_type === "none"
                                    ? "amount"
                                    : c.line.discount_type,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              placeholder={
                                c.line.discount_type === "percentage" ? "10" : "100"
                              }
                              disabled={c.line.discount_type === "none"}
                              className="col-span-2 h-8 px-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white disabled:opacity-40"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Optional extras */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowExtras((v) => !v)}
                  className="w-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-between"
                >
                  <span>Customer, discount, partial payment…</span>
                  <span>{showExtras ? "Hide" : "Show"}</span>
                </button>
                {showExtras && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer name (optional)"
                      className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="grid grid-cols-3 gap-1.5">
                      <select
                        value={overallDiscountType}
                        onChange={(e) => {
                          setOverallDiscountType(e.target.value as DiscountType);
                          setOverallDiscountValue("");
                        }}
                        className="col-span-1 h-9 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="none">No discount</option>
                        <option value="percentage">Discount %</option>
                        <option value="amount">Discount KES</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        value={overallDiscountValue}
                        disabled={overallDiscountType === "none"}
                        onChange={(e) => setOverallDiscountValue(e.target.value)}
                        placeholder={
                          overallDiscountType === "percentage" ? "10" : "100"
                        }
                        className="col-span-2 h-9 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white disabled:opacity-40 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["paid", "partial", "not_paid"] as PaymentStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPaymentStatus(s)}
                            className={`h-9 rounded-lg text-xs font-bold capitalize border ${
                              paymentStatus === s
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {s === "not_paid" ? "Not paid" : s}
                          </button>
                        ),
                      )}
                    </div>
                    {paymentStatus === "partial" && (
                      <input
                        type="number"
                        min={0}
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Amount paid now (KES)"
                        className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-800 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  KES {subtotal.toLocaleString()}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Discount</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    −KES {totalDiscount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-1 mt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  TOTAL
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment buttons + Charge */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 bg-white dark:bg-slate-800 space-y-2 flex-shrink-0">
              <div className="grid grid-cols-5 gap-1">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`h-9 rounded-lg text-[11px] font-bold border transition-colors ${
                      paymentMethod === m
                        ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-transparent hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                    title={m}
                  >
                    {m === "Till Number" ? "Till" : m === "Bank Transfer" ? "Bank" : m}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={cart.length === 0}
                  className="h-12 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Save as draft"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCharge}
                  disabled={cart.length === 0 || submitting}
                  className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                      Processing…
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      {cart.length > 0 ? `CHARGE KES ${total.toLocaleString()}` : "CHARGE"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Stock receive modal ===== */}
      <StockReceiveModal
        isOpen={showStockModal}
        item={currentStockItem}
        onReceiveStock={handleReceiveStock}
        onSkipItem={handleSkipStockItem}
        onCancel={handleCancelStock}
      />

      {/* ===== Quick add product ===== */}
      {showQuickAdd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quick add product
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Product name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickProductName}
                  onChange={(e) => setQuickProductName(e.target.value)}
                  className="w-full h-10 px-3 mt-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Buying price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={quickProductBuying}
                    onChange={(e) => setQuickProductBuying(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 mt-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Selling price *
                  </label>
                  <input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={quickProductSelling}
                    onChange={(e) => setQuickProductSelling(e.target.value)}
                    placeholder="0"
                    className="w-full h-10 px-3 mt-1 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Starts with 0 stock. The sale will proceed and you can receive stock
                from inventory later.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 h-10 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                >
                  Add &amp; insert into cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Drafts panel ===== */}
      {showDrafts && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Saved drafts ({drafts.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowDrafts(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {drafts.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
                  No drafts yet. Use the save icon to keep an unfinished sale.
                </p>
              ) : (
                drafts.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {d.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {d.cart.length} item{d.cart.length !== 1 ? "s" : ""} · {d.soldBy} ·{" "}
                          {new Date(d.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(d)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete draft "${d.name}"?`))
                              handleDeleteDraft(d.id);
                          }}
                          className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-500 hover:text-red-600 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Shortcuts help ===== */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Keyboard shortcuts
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                ["/", "Focus product search"],
                ["Enter", "Add the first search result"],
                ["F1", "Cashier · Khalid"],
                ["F2", "Cashier · Yussuf"],
                ["F3", "Cashier · Zakaria"],
                ["Ctrl + Enter", "Charge & print"],
                ["Esc", "Close popovers"],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between items-center">
                  <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    {k}
                  </kbd>
                  <span className="text-slate-600 dark:text-slate-300">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
