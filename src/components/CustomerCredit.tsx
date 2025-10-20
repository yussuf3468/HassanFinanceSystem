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
} from "lucide-react";
import {
  useCustomerCredits,
  useCreditPayments,
} from "../hooks/useSupabaseQuery";
import { supabase } from "../lib/supabase";
import ModalPortal from "./ModalPortal.tsx";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

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
  status: "active" | "paid" | "overdue" | "partial";
  notes?: string;
  created_at: string;
}

// Removed unused CreditPayment interface

interface CreditForm {
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  credit_date: string;
  due_date: string;
  notes: string;
}

interface PaymentForm {
  credit_id: string;
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

export default function CustomerCredit() {
  const queryClient = useQueryClient();
  const { data: rawCredits = [], isLoading: creditsLoading } = useCustomerCredits();
  const { data: payments = [], isLoading: paymentsLoading } = useCreditPayments();
  const loading = creditsLoading || paymentsLoading;

  // Calculate balance and amount_paid for each credit
  const credits = useMemo(() => {
    return rawCredits.map((credit: any) => {
      const creditPayments = payments.filter(
        (p: any) => p.credit_id === credit.id
      );
      const amount_paid = creditPayments.reduce(
        (sum: number, p: any) => sum + (p.payment_amount || 0),
        0
      );
      const balance = credit.total_amount - amount_paid;
      return { ...credit, amount_paid, balance };
    });
  }, [rawCredits, payments]);

  // Search state for customer lookup
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCredits = useMemo(() => {
    if (!searchTerm.trim()) return credits;
    return credits.filter((c: any) =>
      c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credits, searchTerm]);

  const [showCreditForm, setShowCreditForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingCredit, setEditingCredit] = useState<CustomerCredit | null>(
    null
  );
  const [selectedCredit, setSelectedCredit] = useState<CustomerCredit | null>(
    null
  );
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const [creditForm, setCreditForm] = useState<CreditForm>({
    customer_name: "",
    customer_phone: "",
    total_amount: 0,
    credit_date: getCurrentDateForInput(),
    due_date: "",
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    credit_id: "",
    payment_amount: 0,
    payment_date: getCurrentDateForInput(),
    payment_method: "Cash",
    notes: "",
  });

  // Memoize close handlers to prevent re-renders
  const handleCloseCreditForm = useCallback(() => {
    setShowCreditForm(false);
  }, []);

  const handleClosePaymentForm = useCallback(() => {
    setShowPaymentForm(false);
  }, []);

  const handleClosePaymentHistory = useCallback(() => {
    setShowPaymentHistory(false);
  }, []);

  useEffect(() => {
    createTableIfNotExist();
  }, []);

  async function createTableIfNotExist() {
    try {
      await supabase
        .from("customer_credits" as any)
        .select("id")
        .limit(1);
      await supabase
        .from("credit_payments" as any)
        .select("id")
        .limit(1);
    } catch (error) {
      console.log(
        "Customer credit tables need to be created. Please run database migrations."
      );
    }
  }

  async function handleCreditSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const payload = {
        customer_name: creditForm.customer_name,
        customer_phone: creditForm.customer_phone,
        total_amount: creditForm.total_amount,
        credit_date: creditForm.credit_date,
        due_date: creditForm.due_date || null, // Make optional
        status: "active" as const,
        notes: creditForm.notes || null,
      };

      if (editingCredit) {
        const { error } = await supabase
          .from("customer_credits" as any)
          .update(payload)
          .eq("id", editingCredit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("customer_credits" as any)
          .insert([payload]);
        if (error) throw error;
      }

      setShowCreditForm(false);
      setEditingCredit(null);
      resetCreditForm();

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["customer-credits"] });
    } catch (error) {
      console.error("Error saving customer credit:", error);
      alert("Failed to save customer credit. Please try again.");
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error: paymentError } = await supabase
        .from("credit_payments" as any)
        .insert([
          {
            credit_id: paymentForm.credit_id,
            payment_amount: paymentForm.payment_amount,
            payment_date: paymentForm.payment_date,
            payment_method: paymentForm.payment_method,
            notes: paymentForm.notes || null,
          },
        ]);

      if (paymentError) throw paymentError;

      // Update credit status
      const credit = credits.find((c: any) => c.id === paymentForm.credit_id);
      if (credit) {
        const newBalance = Math.max(
          0,
          credit.balance - paymentForm.payment_amount
        );
        const newStatus =
          newBalance <= 0
            ? "paid"
            : credit.amount_paid > 0
            ? "partial"
            : "active";

        const { error: updateError } = await supabase
          .from("customer_credits" as any)
          .update({ status: newStatus } as any)
          .eq("id", paymentForm.credit_id);

        if (updateError) throw updateError;
      }

      setShowPaymentForm(false);
      resetPaymentForm();

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["customer-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-payments"] });
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment. Please try again.");
    }
  }

  async function handleDeleteCredit(id: string) {
    if (
      !confirm(
        "Are you sure you want to delete this customer credit record? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete associated payments first
      await supabase
        .from("credit_payments" as any)
        .delete()
        .eq("credit_id", id);

      // Then delete the credit
      const { error } = await supabase
        .from("customer_credits" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;

      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ["customer-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-payments"] });
    } catch (error) {
      console.error("Error deleting customer credit:", error);
      alert("Failed to delete customer credit. Please try again.");
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
      credit_id: "",
      payment_amount: 0,
      payment_date: getCurrentDateForInput(),
      payment_method: "Cash",
      notes: "",
    });
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

  function openPaymentForm(credit: CustomerCredit) {
    setPaymentForm({
      ...paymentForm,
      credit_id: credit.id,
      payment_amount: credit.balance,
    });
    setShowPaymentForm(true);
  }

  function viewPaymentHistory(credit: CustomerCredit) {
    setSelectedCredit(credit);
    setShowPaymentHistory(true);
  }

  const getStatusColor = (status: CustomerCredit["status"]) => {
    switch (status) {
      case "paid":
        return "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30";
      case "partial":
        return "bg-blue-600/20 text-blue-400 border border-blue-500/30";
      case "overdue":
        return "bg-red-600/20 text-red-400 border border-red-500/30";
      default:
        return "bg-amber-600/20 text-amber-400 border border-amber-500/30";
    }
  };

  const getStatusIcon = (status: CustomerCredit["status"]) => {
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

  // Calculate totals
  const totalReceivable = credits.reduce(
    (sum: number, c: any) => sum + c.balance,
    0
  );
  const totalCreditGiven = credits.reduce(
    (sum: number, c: any) => sum + c.total_amount,
    0
  );
  const totalCollected = credits.reduce(
    (sum: number, c: any) => sum + c.amount_paid,
    0
  );
  const overdueCredits = credits.filter((c: any) => c.status === "overdue");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading customer credits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
              💳 Deymaha Macaamiisha
            </h1>
            <p className="text-slate-300 mt-1">
              Lacagta aan ku leenahay macaamiisha
            </p>
          </div>
          <button
            onClick={() => {
              resetCreditForm();
              setEditingCredit(null);
              setShowCreditForm(true);
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-300 hover:scale-105 shadow-xl"
          >
            <Plus className="w-5 h-5" />
            <span>New Store Credit / Deyma Cusub</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <TrendingUp className="w-5 h-5 text-red-300" />
          </div>
          <p className="text-slate-300 text-sm">Total Credits</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            KES {totalReceivable.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Money we owe customers</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <HandCoins className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-slate-300 text-sm">Total Paid Back</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            KES {totalCollected.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Returned to customers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-8 h-8 text-purple-400" />
            <Users className="w-5 h-5 text-purple-300" />
          </div>
          <p className="text-slate-300 text-sm">Total Credit / Wadarta</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            KES {totalCreditGiven.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {credits.length} macaamiil
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-amber-400" />
            <DollarSign className="w-5 h-5 text-amber-300" />
          </div>
          <p className="text-slate-300 text-sm">Overdue / Waqtigooda Dhaafay</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {overdueCredits.length}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Needs attention / Dib u eeg
          </p>
        </div>
      </div>

      {/* Customer Search */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-slate-400 w-full sm:w-96"
          placeholder="Search customer by name or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        {searchTerm.trim() && filteredCredits.length > 0 && (
          <div className="text-slate-200 text-sm mt-2 sm:mt-0">
            <strong>{filteredCredits[0].customer_name}</strong> owes you: <span className="font-bold text-emerald-400">KES {filteredCredits
              .filter(c => c.customer_name.toLowerCase() === filteredCredits[0].customer_name.toLowerCase())
              .reduce((sum, c) => sum + c.balance, 0)
              .toLocaleString()}</span>
          </div>
        )}
      </div>
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <Users className="w-6 h-6" />
          <span>Store Credits ({credits.length})</span>
        </h2>

  {filteredCredits.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">No store credits recorded yet.</p>
            <p className="text-slate-500 text-sm mt-2">
              Start tracking money you owe to customers
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                    Contact
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Total
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Paid Back
                  </th>
                  <th className="text-right py-3 px-4 text-slate-300 font-semibold">
                    Balance
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">
                    Due Date
                  </th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-slate-300 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit: any) => (
                  <tr
                    key={credit.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">
                        {credit.customer_name}
                      </div>
                      {credit.notes && (
                        <div className="text-xs text-slate-400 mt-1">
                          {credit.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1 text-slate-300 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{credit.customer_phone}</span>
                        </div>
                        {credit.customer_email && (
                          <div className="flex items-center space-x-1 text-slate-400 text-xs">
                            <Mail className="w-3 h-3" />
                            <span>{credit.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-white">
                      KES {credit.total_amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-400 font-medium">
                      KES {credit.amount_paid.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          credit.balance > 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        KES {credit.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1 text-slate-300 text-sm">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(credit.due_date)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            credit.status
                          )}`}
                        >
                          {getStatusIcon(credit.status)}
                          <span className="capitalize">{credit.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        {credit.balance > 0 && (
                          <button
                            onClick={() => openPaymentForm(credit)}
                            className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors"
                            title="Record Payment"
                          >
                            <HandCoins className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => viewPaymentHistory(credit)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                          title="Payment History"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditForm(credit)}
                          className="p-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCredit(credit.id)}
                          className="p-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingCredit
                ? "Edit Store Credit / Wax Ka Beddel"
                : "New Store Credit / Deyma Cusub"}
            </h2>
            <form onSubmit={handleCreditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Customer Name *
                  </label>
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
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter customer name / Gali magaca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number *
                  </label>
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
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+254 or 07xx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Total Amount (KES) *
                  </label>
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
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Credit Date / Taariikhda Deynta *
                  </label>
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
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date / Maalinta Bixinta
                  </label>
                  <input
                    type="date"
                    value={creditForm.due_date}
                    onChange={(e) =>
                      setCreditForm({ ...creditForm, due_date: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes / Qoraal Dheeraad Ah
                </label>
                <textarea
                  rows={3}
                  value={creditForm.notes}
                  onChange={(e) =>
                    setCreditForm({ ...creditForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Reason for credit, refund details, etc. / Sababta deynta"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseCreditForm}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel / Jooji
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold transition-all"
                >
                  {editingCredit
                    ? "Update Credit / Cusboonaysii"
                    : "Create Credit / Abuuro Deyma"}
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <ModalPortal onClose={handleClosePaymentForm}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-6">
              Pay Back Customer / Macmiilka U Bixiso
            </h2>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Amount (KES) / Lacagta La Bixinayo *
                </label>
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Date / Taariikhda Bixinta *
                </label>
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
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Method / Qaabka Bixinta *
                </label>
                <select
                  required
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  Notes / Qoraal
                </label>
                <textarea
                  rows={2}
                  value={paymentForm.notes}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Payment reference, receipt number, etc. / Tixraac"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePaymentForm}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Cancel / Jooji
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-semibold transition-all"
                >
                  Pay Customer / U Bixiso
                </button>
              </div>
            </form>
          </div>
        </ModalPortal>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && selectedCredit && (
        <ModalPortal onClose={handleClosePaymentHistory}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Payment History / Taariikhda Bixinta -{" "}
              {selectedCredit.customer_name}
            </h2>
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-slate-400 text-sm">
                    Total We Owe / Wadarta
                  </p>
                  <p className="text-white font-bold text-lg">
                    KES {selectedCredit.total_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Paid Back / Bixiyay</p>
                  <p className="text-emerald-400 font-bold text-lg">
                    KES {selectedCredit.amount_paid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Still Owe / Haray</p>
                  <p className="text-amber-400 font-bold text-lg">
                    KES {selectedCredit.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {payments
                .filter((p: any) => p.credit_id === selectedCredit.id)
                .map((payment: any) => (
                  <div
                    key={payment.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <HandCoins className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-emerald-400 text-lg">
                            KES {payment.payment_amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          {formatDate(payment.payment_date)} •{" "}
                          {payment.payment_method}
                        </p>
                        {payment.notes && (
                          <p className="text-slate-500 text-sm mt-1">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {payments.filter((p: any) => p.credit_id === selectedCredit.id)
                .length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No payments recorded yet. / Weli ma jiro bixin la diiwaan
                  galiyay.
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleClosePaymentHistory}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Close / Xir
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
