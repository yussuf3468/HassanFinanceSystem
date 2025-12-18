import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Save,
  History,
  Wallet,
} from "lucide-react";

interface SalesTotals {
  Cash: number;
  Mpesa: number;
  "Till Number": number;
  Card: number;
  "Bank Transfer": number;
}

interface ReconciliationRecord {
  id: string;
  reconciliation_date: string;
  shift: string;
  expected_cash: number;
  expected_mpesa: number;
  expected_till_number: number;
  expected_card: number;
  expected_bank_transfer: number;
  expected_total: number;
  actual_cash: number;
  actual_mpesa: number;
  actual_till_number: number;
  actual_card: number;
  actual_bank_transfer: number;
  actual_total: number;
  variance_cash: number;
  variance_mpesa: number;
  variance_till_number: number;
  variance_card: number;
  variance_bank_transfer: number;
  variance_total: number;
  reconciled_by: string;
  notes: string;
  status: "balanced" | "over" | "short";
  created_at: string;
}

export default function CashReconciliation() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [shift, setShift] = useState("Full Day");
  const [reconciledBy, setReconciledBy] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  
  // Running Balance States
  const [runningBalance, setRunningBalance] = useState<number>(() => {
    const saved = localStorage.getItem("storeRunningBalance");
    return saved ? parseFloat(saved) : 0;
  });
  const [showBalanceModal, setShowBalanceModal] = useState(() => {
    return !localStorage.getItem("storeRunningBalance");
  });
  const [initialBalance, setInitialBalance] = useState("");

  // Actual counted amounts
  const [actualCash, setActualCash] = useState("0");
  const [actualMpesa, setActualMpesa] = useState("0");
  const [actualTillNumber, setActualTillNumber] = useState("0");
  const [actualCard, setActualCard] = useState("0");
  const [actualBankTransfer, setActualBankTransfer] = useState("0");

  // Fetch today's expenses
  const { data: todayExpenses } = useQuery({
    queryKey: ["today-expenses", selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("incurred_on", `${selectedDate}T00:00:00`)
        .lt("incurred_on", `${selectedDate}T23:59:59`);

      if (error) throw error;
      
      const total = data?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
      return total;
    },
    staleTime: 10000,
  });

  // Fetch today's sales totals (including cyber services)
  const { data: salesTotals } = useQuery({
    queryKey: ["sales-totals", selectedDate],
    queryFn: async () => {
      // Get sales totals
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("payment_method, total_sale")
        .gte("sale_date", `${selectedDate}T00:00:00`)
        .lt("sale_date", `${selectedDate}T23:59:59`);

      if (salesError) throw salesError;

      // Get cyber services totals (all as Cash)
      const { data: cyberData, error: cyberError } = await supabase
        .from("cyber_services" as any)
        .select("amount")
        .gte("date", `${selectedDate}T00:00:00`)
        .lt("date", `${selectedDate}T23:59:59`);

      if (cyberError) throw cyberError;

      const totals: SalesTotals = {
        Cash: 0,
        Mpesa: 0,
        "Till Number": 0,
        Card: 0,
        "Bank Transfer": 0,
      };

      // Add sales totals
      salesData?.forEach((sale) => {
        const method = sale.payment_method as keyof SalesTotals;
        if (method in totals) {
          totals[method] += Number(sale.total_sale);
        }
      });

      // Add cyber services totals to Cash
      cyberData?.forEach((service: any) => {
        totals.Cash += Number(service.amount);
      });

      return totals;
    },
    staleTime: 10000,
  });

  // Fetch reconciliation history
  const { data: reconciliations, isLoading: loadingHistory } = useQuery({
    queryKey: ["reconciliations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_reconciliation" as any)
        .select("*")
        .order("reconciliation_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as unknown as ReconciliationRecord[];
    },
    staleTime: 30000,
  });

  // Save reconciliation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const expectedTotal =
        (salesTotals?.Cash || 0) +
        (salesTotals?.Mpesa || 0) +
        (salesTotals?.["Till Number"] || 0) +
        (salesTotals?.Card || 0) +
        (salesTotals?.["Bank Transfer"] || 0);

      const actualTotal =
        parseFloat(actualCash || "0") +
        parseFloat(actualMpesa || "0") +
        parseFloat(actualTillNumber || "0") +
        parseFloat(actualCard || "0") +
        parseFloat(actualBankTransfer || "0");

      const varianceCash =
        parseFloat(actualCash || "0") - (salesTotals?.Cash || 0);
      const varianceMpesa =
        parseFloat(actualMpesa || "0") - (salesTotals?.Mpesa || 0);
      const varianceTillNumber =
        parseFloat(actualTillNumber || "0") -
        (salesTotals?.["Till Number"] || 0);
      const varianceCard =
        parseFloat(actualCard || "0") - (salesTotals?.Card || 0);
      const varianceBankTransfer =
        parseFloat(actualBankTransfer || "0") -
        (salesTotals?.["Bank Transfer"] || 0);
      const varianceTotal = actualTotal - expectedTotal;

      const status =
        varianceTotal === 0 ? "balanced" : varianceTotal > 0 ? "over" : "short";

      const { data, error } = await supabase
        .from("cash_reconciliation" as any)
        .insert({
          reconciliation_date: selectedDate,
          shift,
          expected_cash: salesTotals?.Cash || 0,
          expected_mpesa: salesTotals?.Mpesa || 0,
          expected_till_number: salesTotals?.["Till Number"] || 0,
          expected_card: salesTotals?.Card || 0,
          expected_bank_transfer: salesTotals?.["Bank Transfer"] || 0,
          expected_total: expectedTotal,
          actual_cash: parseFloat(actualCash || "0"),
          actual_mpesa: parseFloat(actualMpesa || "0"),
          actual_till_number: parseFloat(actualTillNumber || "0"),
          actual_card: parseFloat(actualCard || "0"),
          actual_bank_transfer: parseFloat(actualBankTransfer || "0"),
          actual_total: actualTotal,
          variance_cash: varianceCash,
          variance_mpesa: varianceMpesa,
          variance_till_number: varianceTillNumber,
          variance_card: varianceCard,
          variance_bank_transfer: varianceBankTransfer,
          variance_total: varianceTotal,
          reconciled_by: reconciledBy,
          notes,
          status,
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      
      // Update running balance: add actual cash collected, subtract today's expenses
      const cashCollected = parseFloat(actualCash || "0");
      const expensesAmount = todayExpenses || 0;
      const newBalance = runningBalance + cashCollected - expensesAmount;
      setRunningBalance(newBalance);
      localStorage.setItem("storeRunningBalance", newBalance.toString());
      
      alert(
        `✅ Cash reconciliation saved!\n\n` +
        `💰 Cash Added: KES ${cashCollected.toLocaleString()}\n` +
        `💸 Expenses Deducted: KES ${expensesAmount.toLocaleString()}\n` +
        `🏦 New Running Balance: KES ${newBalance.toLocaleString()}`
      );
      
      // Reset form
      setActualCash("0");
      setActualMpesa("0");
      setActualTillNumber("0");
      setActualCard("0");
      setActualBankTransfer("0");
      setNotes("");
    },
    onError: (error: any) => {
      console.error("Full error:", error);
      alert(
        `❌ Error saving reconciliation: ${
          error.message || error.toString()
        }\n\nCheck console for details.`
      );
    },
  });

  // Delete reconciliation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cash_reconciliation" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      alert("✅ Reconciliation deleted successfully!");
    },
    onError: (error: any) => {
      alert(`❌ Error deleting: ${error.message}`);
    },
  });

  const expectedTotal =
    (salesTotals?.Cash || 0) +
    (salesTotals?.Mpesa || 0) +
    (salesTotals?.["Till Number"] || 0) +
    (salesTotals?.Card || 0) +
    (salesTotals?.["Bank Transfer"] || 0);

  const actualTotal =
    parseFloat(actualCash || "0") +
    parseFloat(actualMpesa || "0") +
    parseFloat(actualTillNumber || "0") +
    parseFloat(actualCard || "0") +
    parseFloat(actualBankTransfer || "0");

  const varianceTotal = actualTotal - expectedTotal;

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">
                Reconciliation History
              </h1>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg"
            >
              ← Back to Reconcile
            </button>
          </div>

          {loadingHistory ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {reconciliations?.map((rec) => (
                <div
                  key={rec.id}
                  className={`bg-white/10 backdrop-blur-lg border-2 rounded-xl p-6 ${
                    rec.status === "balanced"
                      ? "border-green-500/30"
                      : rec.status === "over"
                      ? "border-blue-500/30"
                      : "border-red-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">
                          {new Date(rec.reconciliation_date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {rec.reconciled_by}
                        </span>
                        <span>•</span>
                        <span>{rec.shift}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-4 py-2 rounded-lg font-bold ${
                          rec.status === "balanced"
                            ? "bg-green-500/20 text-green-300"
                            : rec.status === "over"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {rec.status === "balanced" && (
                          <CheckCircle className="w-5 h-5 inline mr-2" />
                        )}
                        {rec.status === "over" && (
                          <TrendingUp className="w-5 h-5 inline mr-2" />
                        )}
                        {rec.status === "short" && (
                          <TrendingDown className="w-5 h-5 inline mr-2" />
                        )}
                        {rec.status.toUpperCase()}
                      </div>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Delete this reconciliation record from ${new Date(
                                rec.reconciliation_date
                              ).toLocaleDateString()}?`
                            )
                          ) {
                            deleteMutation.mutate(rec.id);
                          }
                        }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors"
                        style={{
                          touchAction: "manipulation",
                          WebkitTapHighlightColor: "rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        <svg
                          className="w-5 h-5 text-red-400"
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
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-xs text-slate-400 mb-1">
                        Expected Total
                      </p>
                      <p className="text-2xl font-bold text-white">
                        Ksh {rec.expected_total.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-xs text-slate-400 mb-1">
                        Actual Total
                      </p>
                      <p className="text-2xl font-bold text-white">
                        Ksh {rec.actual_total.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-4">
                      <p className="text-xs text-slate-400 mb-1">Variance</p>
                      <p
                        className={`text-2xl font-bold ${
                          rec.variance_total === 0
                            ? "text-green-400"
                            : rec.variance_total > 0
                            ? "text-blue-400"
                            : "text-red-400"
                        }`}
                      >
                        {rec.variance_total >= 0 ? "+" : ""}Ksh{" "}
                        {rec.variance_total.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {rec.notes && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-amber-400 mt-0.5" />
                        <p className="text-sm text-amber-200">{rec.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calculator className="w-10 h-10 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">
                Cash Reconciliation
              </h1>
              <p className="text-slate-300">
                Count physical cash and compare to system records
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            View History
          </button>
        </div>

        {/* Date and Shift Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              style={{ colorScheme: "dark" }}
            >
              <option value="Full Day" className="bg-slate-800 text-white">
                Full Day
              </option>
              <option value="Morning" className="bg-slate-800 text-white">
                Morning
              </option>
              <option value="Evening" className="bg-slate-800 text-white">
                Evening
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reconciled By *
            </label>
            <input
              type="text"
              value={reconciledBy}
              onChange={(e) => setReconciledBy(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Running Balance Card - Prominent Display */}
        <div className="mb-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-10 h-10 text-green-400" />
                <h2 className="text-2xl font-bold text-white">Store Running Balance</h2>
              </div>
              <p className="text-5xl font-black text-green-400 mb-2">
                KES {runningBalance.toLocaleString()}
              </p>
              <p className="text-sm text-green-300">
                💰 Current cash available at store
              </p>
              {todayExpenses && todayExpenses > 0 && (
                <p className="text-xs text-amber-300 mt-2">
                  ⚠️ Today's expenses (KES {todayExpenses.toLocaleString()}) will be deducted on reconciliation
                </p>
              )}
            </div>
            <button
              onClick={() => setShowBalanceModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
            >
              Update Balance
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                Expected Total
              </h3>
            </div>
            <p className="text-4xl font-bold text-white">
              Ksh {expectedTotal.toLocaleString()}
            </p>
            <p className="text-sm text-slate-300 mt-2">From system sales</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="w-8 h-8 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Actual Total</h3>
            </div>
            <p className="text-4xl font-bold text-white">
              Ksh {actualTotal.toLocaleString()}
            </p>
            <p className="text-sm text-slate-300 mt-2">Physically counted</p>
          </div>

          <div
            className={`bg-gradient-to-br rounded-xl p-6 border-2 ${
              varianceTotal === 0
                ? "from-green-500/20 to-emerald-500/20 border-green-500/50"
                : varianceTotal > 0
                ? "from-blue-500/20 to-sky-500/20 border-blue-500/50"
                : "from-red-500/20 to-rose-500/20 border-red-500/50"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              {varianceTotal === 0 ? (
                <CheckCircle className="w-8 h-8 text-green-400" />
              ) : varianceTotal > 0 ? (
                <TrendingUp className="w-8 h-8 text-blue-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
              <h3 className="text-lg font-semibold text-white">Variance</h3>
            </div>
            <p
              className={`text-4xl font-bold ${
                varianceTotal === 0
                  ? "text-green-400"
                  : varianceTotal > 0
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {varianceTotal >= 0 ? "+" : ""}Ksh{" "}
              {varianceTotal.toLocaleString()}
            </p>
            <p className="text-sm text-slate-300 mt-2">
              {varianceTotal === 0
                ? "✅ Balanced"
                : varianceTotal > 0
                ? "📈 Over"
                : "📉 Short"}
            </p>
          </div>
        </div>

        {/* Payment Methods Table */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              Payment Methods Breakdown
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Payment Method
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Expected (Ksh)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Actual (Ksh)
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                    Variance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  {
                    name: "Cash",
                    expected: salesTotals?.Cash || 0,
                    actual: actualCash,
                    setActual: setActualCash,
                  },
                  {
                    name: "Mpesa",
                    expected: salesTotals?.Mpesa || 0,
                    actual: actualMpesa,
                    setActual: setActualMpesa,
                  },
                  {
                    name: "Till Number",
                    expected: salesTotals?.["Till Number"] || 0,
                    actual: actualTillNumber,
                    setActual: setActualTillNumber,
                  },
                  {
                    name: "Card",
                    expected: salesTotals?.Card || 0,
                    actual: actualCard,
                    setActual: setActualCard,
                  },
                  {
                    name: "Bank Transfer",
                    expected: salesTotals?.["Bank Transfer"] || 0,
                    actual: actualBankTransfer,
                    setActual: setActualBankTransfer,
                  },
                ].map((method) => {
                  const variance =
                    parseFloat(method.actual || "0") - method.expected;
                  return (
                    <tr
                      key={method.name}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        {method.name}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-300">
                        {method.expected.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={method.actual}
                          onChange={(e) => method.setActual(e.target.value)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-right focus:ring-2 focus:ring-purple-500"
                          placeholder="0.00"
                        />
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-bold ${
                          variance === 0
                            ? "text-slate-400"
                            : variance > 0
                            ? "text-blue-400"
                            : "text-red-400"
                        }`}
                      >
                        {variance >= 0 ? "+" : ""}
                        {variance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any discrepancies or issues to note..."
            rows={3}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Warnings */}
        {varianceTotal !== 0 && (
          <div
            className={`mb-6 p-4 rounded-lg border-2 flex items-start gap-3 ${
              varianceTotal > 0
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 ${
                varianceTotal > 0 ? "text-blue-400" : "text-red-400"
              }`}
            />
            <div>
              <h4
                className={`font-bold mb-1 ${
                  varianceTotal > 0 ? "text-blue-300" : "text-red-300"
                }`}
              >
                {varianceTotal > 0 ? "Cash Over" : "Cash Short"}
              </h4>
              <p className="text-sm text-slate-300">
                {varianceTotal > 0
                  ? `You have Ksh ${Math.abs(
                      varianceTotal
                    ).toLocaleString()} more than expected. Please verify counts and add notes.`
                  : `You are short Ksh ${Math.abs(
                      varianceTotal
                    ).toLocaleString()}. Please recount and investigate discrepancy.`}
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={() => {
            if (!reconciledBy.trim()) {
              alert('Please enter your name in "Reconciled By" field');
              return;
            }
            if (
              confirm(
                `Save reconciliation with ${
                  varianceTotal === 0
                    ? "BALANCED"
                    : varianceTotal > 0
                    ? "OVER"
                    : "SHORT"
                } status?`
              )
            ) {
              saveMutation.mutate();
            }
          }}
          disabled={saveMutation.isPending || !reconciledBy.trim()}
          className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3"
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "rgba(139, 92, 246, 0.3)",
          }}
        >
          <Save className="w-6 h-6" />
          {saveMutation.isPending ? "Saving..." : "Save Reconciliation"}
        </button>
      </div>

      {/* Initial/Update Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-white">
                {runningBalance === 0 ? "Set Initial Balance" : "Update Running Balance"}
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                {runningBalance === 0
                  ? "🏪 How much cash do you currently have at the store? This will be your starting balance."
                  : `💰 Current Balance: KES ${runningBalance.toLocaleString()}`}
              </p>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {runningBalance === 0 ? "Initial Cash Amount *" : "New Balance Amount *"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-2">
                💡 Count the physical cash in your till/drawer and enter the exact amount
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const amount = parseFloat(initialBalance);
                  if (isNaN(amount) || amount < 0) {
                    alert("Please enter a valid amount");
                    return;
                  }
                  setRunningBalance(amount);
                  localStorage.setItem("storeRunningBalance", amount.toString());
                  setShowBalanceModal(false);
                  setInitialBalance("");
                  alert(`✅ Running balance ${runningBalance === 0 ? 'set' : 'updated'} to: KES ${amount.toLocaleString()}`);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                {runningBalance === 0 ? "Set Balance" : "Update Balance"}
              </button>
              {runningBalance !== 0 && (
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setInitialBalance("");
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            {runningBalance === 0 && (
              <p className="text-amber-300 text-sm mt-4 text-center">
                ⚠️ You must set an initial balance to continue
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
