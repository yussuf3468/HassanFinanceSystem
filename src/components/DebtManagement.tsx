import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useDebts } from "../hooks/useSupabaseQuery";
import { supabase } from "../lib/supabase";
// Multitenancy removed
import ModalPortal from "./ModalPortal.tsx";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

interface Debt {
  id: string;
  lender: string; // maps to DB column 'lender'
  principal: number; // maps to DB column 'principal'
  interest_rate: number;
  started_on: string; // maps to DB column 'started_on'
  due_on: string; // maps to DB column 'due_on'
  status: string; // 'active' | 'closed' | 'overdue' etc. stored in DB as text
  notes?: string | null;
  created_at?: string;
}

interface Payment {
  id: string;
  debt_id: string;
  amount: number;
  paid_on: string;
  notes?: string | null;
  created_at?: string;
}

interface DebtForm {
  lender: string;
  principal: number;
  interest_rate: number;
  started_on: string;
  due_on: string;
  notes: string;
}

interface PaymentForm {
  debt_id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
}

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Mobile Money",
  "Check",
  "Card Payment",
  "Other",
];

export default function DebtManagement() {
  const queryClient = useQueryClient();
  const { data: debtsData = [], isLoading: loading } = useDebts();
  // Ensure runtime type: backend returns rows with DB column names
  const debts = debtsData as unknown as Debt[];

  // Removed unused payments state to satisfy type checker and reduce memory
  const [, /* payments */ /* setPayments */] = useState<Payment[]>([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [debtForm, setDebtForm] = useState<DebtForm>({
    lender: "",
    principal: 0,
    interest_rate: 0,
    started_on: getCurrentDateForInput(),
    due_on: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    debt_id: "",
    payment_amount: 0,
    payment_date: getCurrentDateForInput(),
    payment_method: "Cash",
    notes: "",
  });

  useEffect(() => {
    createTablesIfNotExist();
  }, []);

  async function createTablesIfNotExist() {
    try {
      // Check if tables exist, if not create them
      await supabase.from("debts").select("id").limit(1);
      await supabase.from("debt_payments").select("id").limit(1);
    } catch (error) {
      console.log("Creating debt management tables...");
    }
  }

  async function handleDebtSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Map our form to actual DB column names
      const payload = {
        lender: debtForm.lender,
        principal: debtForm.principal,
        interest_rate: debtForm.interest_rate || 0,
        started_on: debtForm.started_on,
        due_on: debtForm.due_on,
        status: "active",
        notes: debtForm.notes || null,
      };

      if (editingDebt) {
        const { error } = await supabase
          .from("debts")
          .update(payload)
          .eq("id", editingDebt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("debts").insert([payload]);

        if (error) throw error;
      }

      setShowDebtForm(false);
      setEditingDebt(null);
      resetDebtForm();

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    } catch (error) {
      console.error("Error saving debt:", error);
      alert("Failed to save debt. Please try again.");
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Insert payment (DB columns: debt_id, amount, paid_on, notes)
      const { error: paymentError } = await supabase.from("debt_payments").insert([
        {
          debt_id: paymentForm.debt_id,
          amount: paymentForm.payment_amount,
          paid_on: paymentForm.payment_date,
          notes: paymentForm.notes || null,
        },
      ]);

      if (paymentError) throw paymentError;

      // Recompute total paid for this debt and update debt status accordingly
      const debt = debts.find((d) => d.id === paymentForm.debt_id);

      // fetch all payments for this debt to compute remaining balance
      const { data: paymentsData, error: paymentsFetchError } = await supabase
        .from("debt_payments")
        .select("amount")
        .eq("debt_id", paymentForm.debt_id);

      if (paymentsFetchError) throw paymentsFetchError;

      const totalPaid =
        (paymentsData as any[] | null)?.reduce(
          (sum, p) => sum + Number(p?.amount ?? 0),
          0
        ) ?? 0;

      const principalAmount = Number(debt?.principal ?? 0);
      const newBalance = Math.max(0, principalAmount - totalPaid);
      const newStatusDb = newBalance <= 0 ? "closed" : "active";

      const { error: updateError } = await supabase
        .from("debts")
        .update({ status: newStatusDb })
        .eq("id", paymentForm.debt_id);

      if (updateError) throw updateError;

      setShowPaymentForm(false);
      resetPaymentForm();

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    }
  }

  async function handleDeleteDebt(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this debt record? This will also delete all associated payments."
      )
    )
      return;

    try {
      const { error } = await supabase.from("debts").delete().eq("id", id);

      if (error) throw error;

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    } catch (error) {
      console.error("Error deleting debt:", error);
    }
  }

  function handleEditDebt(debt: Debt) {
    setEditingDebt(debt);
    setDebtForm({
      lender: debt.lender,
      principal: debt.principal,
      interest_rate: debt.interest_rate ?? 0,
      started_on: debt.started_on,
      due_on: debt.due_on,
      notes: debt.notes || "",
    });
    setShowDebtForm(true);
  }

  function resetDebtForm() {
    setDebtForm({
      lender: "",
      principal: 0,
      interest_rate: 0,
      started_on: getCurrentDateForInput(),
      due_on: "",
      notes: "",
    });
  }

  function resetPaymentForm() {
    setPaymentForm({
      debt_id: "",
      payment_amount: 0,
      payment_date: getCurrentDateForInput(),
      payment_method: "Cash",
      notes: "",
    });
  }

  function closeDebtForm() {
    setShowDebtForm(false);
    setEditingDebt(null);
    resetDebtForm();
  }

  function closePaymentForm() {
    setShowPaymentForm(false);
    resetPaymentForm();
  }

  // Compute simple totals using principal (payments are stored separately)
  const totalDebt = debts.reduce(
    (sum, debt) => sum + Number(debt.principal ?? 0),
    0
  );
  const activeDebts = debts.filter((debt) => debt.status === "active").length;
  const overdueDebts = debts.filter((debt) => {
    if (debt.status !== "active") return false;
    return new Date(debt.due_on) < new Date();
  }).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed":
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading debt records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/20 mb-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent mb-2">
                💳 Debt Management
              </h1>
              <p className="text-xs sm:text-base text-slate-300">
                Track borrowed money, loans, and repayment schedules
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Make Payment</span>
              </button>
              <button
                onClick={() => setShowDebtForm(true)}
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Debt</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-red-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-red-500/30">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-300 mb-1">
                  Total Principal
                </p>
                <p className="text-lg sm:text-3xl font-bold text-white">
                  KES {totalDebt.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-yellow-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-yellow-500/30">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-300 mb-1">
                  Active Debts
                </p>
                <p className="text-lg sm:text-3xl font-bold text-white">
                  {activeDebts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-orange-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-orange-500/30">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-300 mb-1">
                  Overdue
                </p>
                <p className="text-lg sm:text-3xl font-bold text-white">
                  {overdueDebts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Debts List */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-white/20">
            <h2 className="text-lg sm:text-2xl font-semibold text-white">
              Debt Records
            </h2>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Lender
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Principal
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Interest
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Started
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {debts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <HandCoins className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                      <p className="text-lg font-medium mb-2">
                        No debts recorded
                      </p>
                      <p>
                        Add borrowed money and loan information to track
                        repayments
                      </p>
                    </td>
                  </tr>
                ) : (
                  debts.map((debt) => {
                    const isOverdue =
                      debt.status === "active" &&
                      new Date(debt.due_on) < new Date();
                    const actualStatus = isOverdue ? "overdue" : debt.status;

                    return (
                      <tr
                        key={debt.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">
                              {debt.lender}
                            </p>
                            <p className="text-sm text-slate-300">
                              {debt.notes}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          KES {(debt.principal ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {debt.interest_rate ?? 0}%
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatDate(debt.started_on)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatDate(debt.due_on)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(actualStatus)}
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                actualStatus
                              )}`}
                            >
                              {actualStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditDebt(debt)}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {debts.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <p className="text-lg font-medium mb-2">No debts recorded</p>
                <p className="text-sm">Add your first debt to start tracking</p>
              </div>
            ) : (
              <div className="p-3 sm:p-6 space-y-3">
                {debts.map((debt) => {
                  const isOverdue =
                    new Date(debt.due_on) < new Date() && debt.status !== "closed";
                  return (
                    <div
                      key={debt.id}
                      className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                debt.status === "closed"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : isOverdue
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {debt.status === "closed"
                                ? "✓ Closed"
                                : isOverdue
                                ? "⚠️ Overdue"
                                : "⏳ Active"}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {debt.lender}
                          </h4>
                          <p className="text-xs text-slate-300 mb-2">
                            {debt.notes}
                          </p>
                          <div className="flex flex-col gap-1 text-xs text-slate-300">
                            <span>
                              Principal: KES {(debt.principal ?? 0).toLocaleString()}
                            </span>
                            <span>Due: {formatDate(debt.due_on)}</span>
                            {debt.interest_rate > 0 && (
                              <span>Interest: {debt.interest_rate}%</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-400 mb-2">
                            KES {(debt.principal ?? 0).toLocaleString()}
                          </p>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEditDebt(debt)}
                              className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Debt Modal */}
      {showDebtForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[1000]">
            <div className="bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-2xl shadow-2xl border border-white/20 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg sm:text-2xl font-semibold text-white mb-4 sm:mb-6">
                {editingDebt ? "Edit Debt" : "Add New Debt"}
              </h3>

              <form
                onSubmit={handleDebtSubmit}
                className="space-y-3 sm:space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Lender
                    </label>
                    <input
                      type="text"
                      value={debtForm.lender}
                      onChange={(e) =>
                        setDebtForm((prev) => ({
                          ...prev,
                          lender: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Bank name, person, or institution"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Principal Amount (KES)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={debtForm.principal}
                      onChange={(e) =>
                        setDebtForm((prev) => ({
                          ...prev,
                          principal: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Interest Rate (% per year)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={debtForm.interest_rate}
                      onChange={(e) =>
                        setDebtForm((prev) => ({
                          ...prev,
                          interest_rate: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Started On
                    </label>
                    <input
                      type="date"
                      value={debtForm.started_on}
                      onChange={(e) =>
                        setDebtForm((prev) => ({
                          ...prev,
                          started_on: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={debtForm.due_on}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        due_on: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={debtForm.notes}
                    onChange={(e) =>
                      setDebtForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Additional details about this debt"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={closeDebtForm}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-white/20 text-slate-300 rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg sm:rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 text-sm sm:text-base"
                  >
                    {editingDebt ? "Update" : "Add"} Debt
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Make Payment Modal */}
      {showPaymentForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold text-white mb-6">
                Make Debt Payment
              </h3>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Debt
                  </label>
                  <select
                    value={paymentForm.debt_id}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        debt_id: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a debt...</option>
                    {debts
                      .filter((debt) => debt.status === "active")
                      .map((debt) => (
                        <option key={debt.id} value={debt.id}>
                          {debt.lender} - KES {debt.principal.toLocaleString()}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Amount (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentForm.payment_amount}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        payment_amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        payment_date: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        payment_method: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Payment details or reference"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={closePaymentForm}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-white/20 text-slate-300 rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 text-sm sm:text-base"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
