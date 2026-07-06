import { useEffect, useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  HandCoins,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Eye,
  Receipt,
  History,
  X,
} from "lucide-react";
import {
  useCustomerCredits,
  useCreditPayments,
} from "../hooks/useSupabaseQuery";
import {
  addCreditPayment,
  checkCustomerCreditTables,
  createCustomerCredit,
  deleteCustomerCreditWithPayments,
  updateCustomerCredit,
  updateCustomerCreditStatus,
} from "../api";
import ModalPortal from "./ModalPortal.tsx";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

type CreditStatus = "active" | "paid" | "overdue" | "partial";

interface CustomerCredit {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  credit_date: string;
  due_date: string;
  status: CreditStatus;
  notes?: string;
  created_at: string;
}

/** All the individual debts for one customer, rolled up. */
interface GroupedCustomer {
  key: string;
  name: string;
  phone: string;
  email?: string;
  credits: CustomerCredit[];
  totalCredit: number;
  totalPaid: number;
  balance: number;
  earliestDue: string | null;
  status: CreditStatus;
}

interface CreditForm {
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  credit_date: string;
  due_date: string;
  notes: string;
}

interface PaymentForm {
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

const PAYMENT_METHODS = [
  "Cash",
  "M-Pesa",
  "Bank Transfer",
  "Check",
  "Card Payment",
  "Other",
];

const inputClass =
  "w-full px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";

const labelClass =
  "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2";

const getStatusColor = (status: CreditStatus) => {
  switch (status) {
    case "paid":
      return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700";
    case "partial":
      return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700";
    case "overdue":
      return "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700";
    default:
      return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700";
  }
};

const getStatusIcon = (status: CreditStatus) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="w-4 h-4" />;
    case "partial":
      return <Clock className="w-4 h-4" />;
    case "overdue":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

/** Timestamp (ms) of a customer's most recent payment, or null if none. */
function lastPaymentAt(customer: GroupedCustomer, payments: any[]): number | null {
  const creditIds = new Set(customer.credits.map((c) => c.id));
  let latest: number | null = null;
  for (const p of payments) {
    if (!creditIds.has(p.credit_id)) continue;
    const t = new Date(p.payment_date).getTime();
    if (Number.isFinite(t) && (latest === null || t > latest)) latest = t;
  }
  return latest;
}

export default function CustomerCredit() {
  const queryClient = useQueryClient();
  const { data: rawCredits = [], isLoading: creditsLoading } =
    useCustomerCredits();
  const { data: payments = [], isLoading: paymentsLoading } =
    useCreditPayments();
  const loading = creditsLoading || paymentsLoading;

  // Per-credit balance and amount_paid.
  const credits = useMemo<CustomerCredit[]>(() => {
    return (rawCredits as any[]).map((credit) => {
      const amount_paid = (payments as any[])
        .filter((p) => p.credit_id === credit.id)
        .reduce((sum, p) => sum + (p.payment_amount || 0), 0);
      return {
        ...credit,
        amount_paid,
        balance: (credit.total_amount || 0) - amount_paid,
      };
    });
  }, [rawCredits, payments]);

  // Roll individual debts up into one entry per customer (keyed by phone).
  const customers = useMemo<GroupedCustomer[]>(() => {
    const map = new Map<string, GroupedCustomer>();
    for (const c of credits) {
      const key = String(c.customer_phone || "").trim() || c.customer_name;
      let g = map.get(key);
      if (!g) {
        g = {
          key,
          name: c.customer_name,
          phone: c.customer_phone,
          email: c.customer_email,
          credits: [],
          totalCredit: 0,
          totalPaid: 0,
          balance: 0,
          earliestDue: null,
          status: "active",
        };
        map.set(key, g);
      }
      g.credits.push(c);
      g.totalCredit += c.total_amount || 0;
      g.totalPaid += c.amount_paid || 0;
      g.balance += c.balance || 0;
    }

    const now = Date.now();
    return Array.from(map.values())
      .map((g) => {
        g.credits.sort(
          (a, b) =>
            new Date(b.credit_date).getTime() -
            new Date(a.credit_date).getTime(),
        );
        const dues = g.credits
          .filter((c) => c.balance > 0 && c.due_date)
          .map((c) => c.due_date)
          .sort();
        g.earliestDue = dues[0] || null;
        if (g.balance <= 0.001) g.status = "paid";
        else if (
          g.credits.some(
            (c) =>
              c.balance > 0 &&
              c.due_date &&
              new Date(c.due_date).getTime() < now,
          )
        )
          g.status = "overdue";
        else if (g.totalPaid > 0) g.status = "partial";
        else g.status = "active";
        return g;
      })
      .sort((a, b) => b.balance - a.balance);
  }, [credits]);

  // Split into customers who still owe money vs. those fully settled.
  // Only the outstanding ones belong in the main list; settled customers
  // move into the "Paid history" view.
  const outstandingCustomers = useMemo(
    () => customers.filter((c) => c.balance > 0.001),
    [customers],
  );
  const settledCustomers = useMemo(
    () =>
      customers
        .filter((c) => c.balance <= 0.001 && c.totalCredit > 0)
        .sort(
          (a, b) =>
            (lastPaymentAt(b, payments) ?? 0) - (lastPaymentAt(a, payments) ?? 0),
        ),
    [customers, payments],
  );

  const [searchTerm, setSearchTerm] = useState("");
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return outstandingCustomers;
    const q = searchTerm.toLowerCase();
    return outstandingCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q),
    );
  }, [outstandingCustomers, searchTerm]);

  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showPaidHistory, setShowPaidHistory] = useState(false);
  const [editingCredit, setEditingCredit] = useState<CustomerCredit | null>(
    null,
  );
  // Modals track a customer by key so they stay in sync after a mutation.
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [paymentKey, setPaymentKey] = useState<string | null>(null);
  const detailCustomer = useMemo(
    () => customers.find((c) => c.key === detailKey) || null,
    [customers, detailKey],
  );
  const paymentCustomer = useMemo(
    () => customers.find((c) => c.key === paymentKey) || null,
    [customers, paymentKey],
  );

  const [creditForm, setCreditForm] = useState<CreditForm>({
    customer_name: "",
    customer_phone: "",
    total_amount: 0,
    credit_date: getCurrentDateForInput(),
    due_date: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    payment_amount: 0,
    payment_date: getCurrentDateForInput(),
    payment_method: "Cash",
    notes: "",
  });

  const handleCloseCreditForm = useCallback(() => setShowCreditForm(false), []);
  const handleClosePaymentForm = useCallback(() => {
    setShowPaymentForm(false);
    setPaymentKey(null);
  }, []);
  const handleCloseDetail = useCallback(() => setDetailKey(null), []);

  useEffect(() => {
    checkCustomerCreditTables().catch(() =>
      console.log(
        "Customer credit tables need to be created. Please run database migrations.",
      ),
    );
  }, []);

  async function refreshCredits() {
    await queryClient.invalidateQueries({ queryKey: ["customer-credits"] });
    await queryClient.invalidateQueries({ queryKey: ["credit-payments"] });
  }

  async function handleCreditSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        customer_name: creditForm.customer_name,
        customer_phone: creditForm.customer_phone,
        total_amount: creditForm.total_amount,
        credit_date: creditForm.credit_date,
        due_date: creditForm.due_date || null,
        status: "active" as const,
        notes: creditForm.notes || null,
      };
      if (editingCredit) {
        await updateCustomerCredit(editingCredit.id, payload);
      } else {
        await createCustomerCredit(payload);
      }
      setShowCreditForm(false);
      setEditingCredit(null);
      resetCreditForm();
      await refreshCredits();
    } catch (error) {
      console.error("Error saving customer credit:", error);
      alert("Failed to save customer credit. Please try again.");
    }
  }

  // A single payment is spread across the customer's outstanding debts,
  // oldest first, until the amount is used up.
  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentCustomer) return;
    try {
      let remaining = paymentForm.payment_amount;
      const unpaid = paymentCustomer.credits
        .filter((c) => c.balance > 0)
        .sort(
          (a, b) =>
            new Date(a.credit_date).getTime() -
            new Date(b.credit_date).getTime(),
        );

      for (const c of unpaid) {
        if (remaining <= 0) break;
        const applied = Math.min(remaining, c.balance);
        await addCreditPayment({
          credit_id: c.id,
          payment_amount: applied,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          notes: paymentForm.notes || null,
        });
        remaining -= applied;
        await updateCustomerCreditStatus(
          c.id,
          applied >= c.balance - 0.001 ? "paid" : "partial",
        );
      }

      setShowPaymentForm(false);
      setPaymentKey(null);
      resetPaymentForm();
      await refreshCredits();
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    }
  }

  async function handleDeleteCredit(id: string) {
    if (
      !confirm(
        "Delete this debt record? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteCustomerCreditWithPayments(id);
      await refreshCredits();
    } catch (error) {
      console.error("Error deleting customer credit:", error);
      alert("Failed to delete. Please try again.");
    }
  }

  function resetCreditForm() {
    setCreditForm({
      customer_name: "",
      customer_phone: "",
      total_amount: 0,
      credit_date: getCurrentDateForInput(),
      due_date: "",
      notes: "",
    });
  }

  function resetPaymentForm() {
    setPaymentForm({
      payment_amount: 0,
      payment_date: getCurrentDateForInput(),
      payment_method: "Cash",
      notes: "",
    });
  }

  function openNewCreditForm(prefill?: { name: string; phone: string }) {
    resetCreditForm();
    if (prefill) {
      setCreditForm((f) => ({
        ...f,
        customer_name: prefill.name,
        customer_phone: prefill.phone,
      }));
    }
    setEditingCredit(null);
    setShowCreditForm(true);
  }

  function openEditForm(credit: CustomerCredit) {
    setEditingCredit(credit);
    setCreditForm({
      customer_name: credit.customer_name,
      customer_phone: credit.customer_phone,
      total_amount: credit.total_amount,
      credit_date: credit.credit_date,
      due_date: credit.due_date || "",
      notes: credit.notes || "",
    });
    setShowCreditForm(true);
  }

  function openPaymentForm(customer: GroupedCustomer) {
    setPaymentKey(customer.key);
    setPaymentForm({
      payment_amount: customer.balance,
      payment_date: getCurrentDateForInput(),
      payment_method: "Cash",
      notes: "",
    });
    setShowPaymentForm(true);
  }

  // Totals
  const totalReceivable = customers.reduce((s, c) => s + c.balance, 0);
  const totalCreditGiven = customers.reduce((s, c) => s + c.totalCredit, 0);
  const totalCollected = customers.reduce((s, c) => s + c.totalPaid, 0);
  const overdueCount = customers.filter((c) => c.status === "overdue").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-slate-700 dark:text-slate-300 text-lg">
          Loading customer credits...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Customer Credit
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
              Track credit owed by customers and their repayments
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPaidHistory(true)}
              className="relative bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
              title="Customers who have paid off their debt"
            >
              <History className="w-5 h-5" />
              <span className="hidden sm:inline">Paid history</span>
              {settledCustomers.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {settledCustomers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => openNewCreditForm()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:scale-105 shadow-lg border-2 border-emerald-400 dark:border-emerald-500"
            >
              <Plus className="w-5 h-5" />
              <span>New Store Credit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <TrendingUp className="w-5 h-5 text-red-400 dark:text-red-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Outstanding Balance
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            KES {totalReceivable.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Owed by customers
          </p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <HandCoins className="w-5 h-5 text-emerald-400 dark:text-emerald-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Total Collected
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            KES {totalCollected.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Repaid by customers
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            <Users className="w-5 h-5 text-amber-400 dark:text-amber-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Total Credit Given
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            KES {totalCreditGiven.toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <DollarSign className="w-5 h-5 text-orange-400 dark:text-orange-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Overdue</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {overdueCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Needs attention
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 w-full sm:w-96 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        placeholder="Search customer by name or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Customers table */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
          <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span>
            Owing customers ({filteredCustomers.length}
            {searchTerm.trim() ? ` of ${outstandingCustomers.length}` : ""})
          </span>
        </h2>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm.trim() ? (
              <>
                <CreditCard className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No customers match your search.
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Try a different name or phone number
                </p>
              </>
            ) : settledCustomers.length > 0 ? (
              <>
                <CheckCircle className="w-16 h-16 text-emerald-400 dark:text-emerald-500 mx-auto mb-4" />
                <p className="text-slate-700 dark:text-slate-200 font-semibold">
                  All debts are settled 🎉
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Nobody currently owes money. Tap{" "}
                  <button
                    onClick={() => setShowPaidHistory(true)}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Paid history
                  </button>{" "}
                  to see who has paid.
                </p>
              </>
            ) : (
              <>
                <CreditCard className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No customer credit recorded yet.
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Credit sales and manual credits will appear here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 dark:border-slate-700">
                  {["Customer", "Contact", "Total", "Paid", "Balance", "Next Due", "Status", ""].map(
                    (h, i) => (
                      <th
                        key={h || i}
                        className={`py-3 px-4 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider ${
                          ["Total", "Paid", "Balance"].includes(h)
                            ? "text-right"
                            : h === "Status"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.key}
                    onClick={() => setDetailKey(cust.key)}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {cust.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cust.credits.length} debt
                        {cust.credits.length !== 1 ? "s" : ""} · tap for details
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 text-sm">
                        <Phone className="w-3 h-3" />
                        <span>{cust.phone || "—"}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900 dark:text-white">
                      KES {cust.totalCredit.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      KES {cust.totalPaid.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          cust.balance > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        KES {cust.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {cust.earliestDue ? formatDate(cust.earliestDue) : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            cust.status,
                          )}`}
                        >
                          {getStatusIcon(cust.status)}
                          <span className="capitalize">{cust.status}</span>
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-4 px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {cust.balance > 0 && (
                          <button
                            onClick={() => openPaymentForm(cust)}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800"
                            title="Record Payment"
                          >
                            <HandCoins className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDetailKey(cust.key)}
                          className="p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-colors border border-blue-200 dark:border-blue-800"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Credit Form Modal */}
      {showCreditForm && (
        <ModalPortal onClose={handleCloseCreditForm}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {editingCredit ? "Edit Debt" : "New Store Credit"}
            </h2>
            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={creditForm.customer_name}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        customer_name: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={creditForm.customer_phone}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        customer_phone: e.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="+254 or 07xx"
                  />
                </div>
                <div>
                  <label className={labelClass}>Total Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={creditForm.total_amount || ""}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        total_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={labelClass}>Credit Date *</label>
                  <input
                    type="date"
                    required
                    value={creditForm.credit_date}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        credit_date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    value={creditForm.due_date}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, due_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  rows={3}
                  value={creditForm.notes}
                  onChange={(e) =>
                    setCreditForm({ ...creditForm, notes: e.target.value })
                  }
                  className={inputClass}
                  placeholder="What was taken on credit, reason, etc."
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreditForm}
                  className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                  {editingCredit ? "Update Debt" : "Create Credit"}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && paymentCustomer && (
        <ModalPortal onClose={handleClosePaymentForm}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Record Payment
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {paymentCustomer.name} owes{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                KES {paymentCustomer.balance.toLocaleString()}
              </span>
              . Payment is applied to their oldest debts first.
            </p>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Payment Amount (KES) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={paymentForm.payment_amount || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className={labelClass}>Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.payment_date}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_date: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Payment Method *</label>
                <select
                  required
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Payment reference, receipt number, etc."
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentForm}
                  className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Customer Detail Modal */}
      {detailCustomer && (
        <ModalPortal onClose={handleCloseDetail}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {detailCustomer.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {detailCustomer.phone || "—"}
                </p>
              </div>
              <span
                className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                  detailCustomer.status,
                )}`}
              >
                {getStatusIcon(detailCustomer.status)}
                <span className="capitalize">{detailCustomer.status}</span>
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-5 text-center">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Total Credit
                </p>
                <p className="text-slate-900 dark:text-white font-bold">
                  KES {detailCustomer.totalCredit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Paid
                </p>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                  KES {detailCustomer.totalPaid.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs">
                  Balance
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-bold">
                  KES {detailCustomer.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Individual debts */}
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Receipt className="w-4 h-4" /> Debts taken (
              {detailCustomer.credits.length})
            </h3>
            <div className="space-y-2 mb-6">
              {detailCustomer.credits.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          KES {c.total_amount.toLocaleString()}
                        </span>
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(
                            c.status,
                          )}`}
                        >
                          <span className="capitalize">{c.status}</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Taken {formatDate(c.credit_date)}
                        {c.due_date ? ` · due ${formatDate(c.due_date)}` : ""} ·{" "}
                        balance{" "}
                        <span
                          className={
                            c.balance > 0
                              ? "text-amber-600 dark:text-amber-400 font-semibold"
                              : "text-emerald-600 dark:text-emerald-400 font-semibold"
                          }
                        >
                          KES {c.balance.toLocaleString()}
                        </span>
                      </p>
                      {c.notes && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
                          {c.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditForm(c)}
                        className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCredit(c.id)}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment history */}
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <HandCoins className="w-4 h-4" /> Payment history
            </h3>
            <div className="space-y-2">
              {(() => {
                const creditIds = new Set(
                  detailCustomer.credits.map((c) => c.id),
                );
                const custPayments = (payments as any[])
                  .filter((p) => creditIds.has(p.credit_id))
                  .sort(
                    (a, b) =>
                      new Date(b.payment_date).getTime() -
                      new Date(a.payment_date).getTime(),
                  );
                if (custPayments.length === 0) {
                  return (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-3 text-center">
                      No payments recorded yet.
                    </p>
                  );
                }
                return custPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2"
                  >
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        KES {p.payment_amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {formatDate(p.payment_date)} · {p.payment_method}
                      </span>
                      {p.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="flex items-center justify-between gap-3 mt-6">
              <button
                onClick={() =>
                  openNewCreditForm({
                    name: detailCustomer.name,
                    phone: detailCustomer.phone,
                  })
                }
                className="px-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add debt
              </button>
              <div className="flex items-center gap-3">
                {detailCustomer.balance > 0 && (
                  <button
                    onClick={() => openPaymentForm(detailCustomer)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <HandCoins className="w-4 h-4" /> Record payment
                  </button>
                )}
                <button
                  onClick={handleCloseDetail}
                  className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Paid History Modal — customers who have cleared their debt */}
      {showPaidHistory && (
        <ModalPortal onClose={() => setShowPaidHistory(false)}>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                Paid history
              </h2>
              <button
                onClick={() => setShowPaidHistory(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Customers who have fully paid off their debt. Tap a name to view
              their debts and payment records.
            </p>

            {settledCustomers.length === 0 ? (
              <div className="text-center py-12">
                <HandCoins className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No fully-paid customers yet.
                </p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
                  Once a customer clears their balance, they'll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {settledCustomers.map((cust) => {
                  const paidAt = lastPaymentAt(cust, payments as any[]);
                  return (
                    <button
                      key={cust.key}
                      onClick={() => {
                        setShowPaidHistory(false);
                        setDetailKey(cust.key);
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 px-4 py-3 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {cust.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          {cust.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {cust.phone}
                            </span>
                          )}
                          <span>
                            {cust.credits.length} debt
                            {cust.credits.length !== 1 ? "s" : ""} cleared
                          </span>
                          {paidAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Paid {formatDate(new Date(paidAt).toISOString())}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">
                          KES {cust.totalPaid.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          total paid
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPaidHistory(false)}
                className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
