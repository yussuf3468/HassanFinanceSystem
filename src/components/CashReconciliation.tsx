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

  // Running Balance States - 3 separate balances
  // Fetch current store balances from database
  const { data: storeBalances } = useQuery({
    queryKey: ["store-balances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_balances" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no record exists, create one
        if (error.code === "PGRST116") {
          const { data: newData, error: insertError } = await supabase
            .from("store_balances" as any)
            .insert({
              cash_balance: 0,
              mpesa_agent_balance: 0,
              mpesa_phone_balance: 0,
            })
            .select()
            .single();
          if (insertError) throw insertError;
          return newData;
        }
        throw error;
      }
      return data;
    },
    staleTime: 10000,
  });

  const cashBalance = (storeBalances as any)?.cash_balance || 0;
  const mpesaAgentBalance = (storeBalances as any)?.mpesa_agent_balance || 0;
  const mpesaPhoneBalance = (storeBalances as any)?.mpesa_phone_balance || 0;
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [initialCashBalance, setInitialCashBalance] = useState("");
  const [initialMpesaAgentBalance, setInitialMpesaAgentBalance] = useState("");
  const [initialMpesaPhoneBalance, setInitialMpesaPhoneBalance] = useState("");

  // Today's expenses and deposits input
  const [todayExpenses, setTodayExpenses] = useState("0");
  const [todayDeposits, setTodayDeposits] = useState("0");

  // Actual counted amounts - Only 3 payment methods
  const [actualCash, setActualCash] = useState("0");
  const [actualMpesa, setActualMpesa] = useState("0");
  const [actualTillNumber, setActualTillNumber] = useState("0");

  // Fetch today's sales totals (including cyber services)
  const { data: salesTotals } = useQuery({
    queryKey: ["sales-totals", selectedDate],
    queryFn: async () => {
      // Get sales totals
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("payment_method, total_sale")
        .gte("sale_date", `${selectedDate}T00:00:00`)
        .lte("sale_date", `${selectedDate}T23:59:59`);

      if (salesError) throw salesError;

      // Get cyber services totals (all as Cash)
      const { data: cyberData, error: cyberError } = await supabase
        .from("cyber_services" as any)
        .select("amount")
        .gte("date", `${selectedDate}T00:00:00`)
        .lte("date", `${selectedDate}T23:59:59`);

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
        parseFloat(actualTillNumber || "0");

      const varianceCash =
        parseFloat(actualCash || "0") - (salesTotals?.Cash || 0);
      const varianceMpesa =
        parseFloat(actualMpesa || "0") - (salesTotals?.Mpesa || 0);
      const varianceTillNumber =
        parseFloat(actualTillNumber || "0") -
        (salesTotals?.["Till Number"] || 0);

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
          expected_card: 0,
          expected_bank_transfer: 0,
          expected_total: expectedTotal,
          actual_cash: parseFloat(actualCash || "0"),
          actual_mpesa: parseFloat(actualMpesa || "0"),
          actual_till_number: parseFloat(actualTillNumber || "0"),
          actual_card: 0,
          actual_bank_transfer: 0,
          actual_total: actualTotal,
          variance_cash: varianceCash,
          variance_mpesa: varianceMpesa,
          variance_till_number: varianceTillNumber,
          variance_card: 0,
          variance_bank_transfer: 0,
          variance_total: varianceTotal,
          reconciled_by: reconciledBy,
          notes,
          status,
          expenses: parseFloat(todayExpenses || "0"),
          deposits: parseFloat(todayDeposits || "0"),
        })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });

      // Update 3 running balances in database
      const actualCashCounted = parseFloat(actualCash || "0");
      const actualMpesaCounted = parseFloat(actualMpesa || "0");
      const actualTillCounted = parseFloat(actualTillNumber || "0");
      const expensesAmount = parseFloat(todayExpenses || "0");
      const depositsAmount = parseFloat(todayDeposits || "0");

      // New balances are the actual counted amounts + deposits - expenses
      // (actual counted already includes previous balance + today's sales)
      const newCashBalance =
        actualCashCounted + depositsAmount - expensesAmount;

      // Mpesa balances are the actual counted amounts
      const newMpesaAgentBalance = actualMpesaCounted;

      // Phone balance is the actual counted amount
      const newMpesaPhoneBalance = actualTillCounted;

      // Update database
      await supabase
        .from("store_balances" as any)
        .update({
          cash_balance: newCashBalance,
          mpesa_agent_balance: newMpesaAgentBalance,
          mpesa_phone_balance: newMpesaPhoneBalance,
        })
        .eq("id", (storeBalances as any)?.id);

      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: ["store-balances"] });

      // Show success message
      const message = document.createElement("div");
      message.className =
        "fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md";
      message.innerHTML = `
        <div class="font-bold text-lg mb-2">✅ Reconciliation Saved!</div>
        <div class="text-sm space-y-1">
          <div>💵 Cash Balance: KES ${newCashBalance.toLocaleString()}</div>
          <div>📱 Mpesa Agent: KES ${newMpesaAgentBalance.toLocaleString()}</div>
          <div>☎️ Mpesa Phone: KES ${newMpesaPhoneBalance.toLocaleString()}</div>
          ${
            depositsAmount > 0
              ? `<div class="text-green-200">💰 Deposits: +KES ${depositsAmount.toLocaleString()}</div>`
              : ""
          }
          ${
            expensesAmount > 0
              ? `<div class="text-amber-200">💸 Expenses: -KES ${expensesAmount.toLocaleString()}</div>`
              : ""
          }
        </div>
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);

      // Reset form
      setActualCash("0");
      setActualMpesa("0");
      setActualTillNumber("0");
      setTodayExpenses("0");
      setTodayDeposits("0");
      setNotes("");
    },
    onError: (error: any) => {
      console.error("Full error:", error);
      const message = document.createElement("div");
      message.className =
        "fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50 max-w-md";
      message.innerHTML = `
        <div class="font-bold text-lg mb-2">❌ Error Saving</div>
        <div class="text-sm">${error.message || error.toString()}</div>
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 5000);
    },
  });

  const expectedTotal =
    (salesTotals?.Cash || 0) +
    (salesTotals?.Mpesa || 0) +
    (salesTotals?.["Till Number"] || 0);

  const actualTotal =
    parseFloat(actualCash || "0") +
    parseFloat(actualMpesa || "0") +
    parseFloat(actualTillNumber || "0");

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

                  {/* Expenses and Deposits */}
                  {((rec as any).expenses > 0 || (rec as any).deposits > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {(rec as any).deposits > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-xs text-slate-400">Deposits</p>
                              <p className="text-lg font-bold text-green-400">
                                +KES {(rec as any).deposits.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {(rec as any).expenses > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-amber-400" />
                            <div>
                              <p className="text-xs text-slate-400">Expenses</p>
                              <p className="text-lg font-bold text-amber-400">
                                -KES {(rec as any).expenses.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {rec.notes && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-purple-400 mt-0.5" />
                        <p className="text-sm text-purple-200">{rec.notes}</p>
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

        {/* Running Balances - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-500/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-7 h-7 text-amber-400" />
              <h3 className="text-lg font-bold text-white">
                Total Store Balance
              </h3>
            </div>
            <p className="text-3xl font-black text-amber-400 mb-1">
              KES{" "}
              {(
                cashBalance +
                mpesaAgentBalance +
                mpesaPhoneBalance
              ).toLocaleString()}
            </p>
            <p className="text-xs text-amber-300">
              💰 Combined balance (All accounts)
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-7 h-7 text-green-400" />
              <h3 className="text-lg font-bold text-white">Cash Balance</h3>
            </div>
            <p className="text-3xl font-black text-green-400 mb-1">
              KES {cashBalance.toLocaleString()}
            </p>
            <p className="text-xs text-green-300">💵 Physical cash at store</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-7 h-7 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Mpesa Agent</h3>
            </div>
            <p className="text-3xl font-black text-blue-400 mb-1">
              KES {mpesaAgentBalance.toLocaleString()}
            </p>
            <p className="text-xs text-blue-300">📱 Agent balance</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-7 h-7 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Mpesa Phone</h3>
            </div>
            <p className="text-3xl font-black text-purple-400 mb-1">
              KES {mpesaPhoneBalance.toLocaleString()}
            </p>
            <p className="text-xs text-purple-300">☎️ Phone balance</p>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowBalanceModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all shadow-lg"
          >
            Update Balances
          </button>
        </div>

        {/* Previous Balance Display */}
        <div className="mb-6 bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Previous Closing Balance (From Last Reconciliation)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Cash</p>
              <p className="text-xl font-bold text-green-400">
                KES {cashBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Mpesa Agent</p>
              <p className="text-xl font-bold text-blue-400">
                KES {mpesaAgentBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Mpesa Phone</p>
              <p className="text-xl font-bold text-purple-400">
                KES {mpesaPhoneBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Total</p>
              <p className="text-xl font-bold text-amber-400">
                KES{" "}
                {(
                  cashBalance +
                  mpesaAgentBalance +
                  mpesaPhoneBalance
                ).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            💡 This is what you had at the end of last reconciliation
          </p>
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
            <p className="text-sm text-slate-300 mt-2">
              From today's sales only
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Calculator className="w-8 h-8 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Actual Total</h3>
            </div>
            <p className="text-4xl font-bold text-white">
              Ksh {actualTotal.toLocaleString()}
            </p>
            <p className="text-sm text-slate-300 mt-2">
              What you entered below
            </p>
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
        {/* Clear Instructions */}
        <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            📋 How to Close Daily Book
          </h3>
          <div className="space-y-2 text-sm text-slate-200">
            <p>
              <strong>Step 1:</strong> Count physical cash at store → Enter in
              "💵 Cash" below
            </p>
            <p>
              <strong>Step 2:</strong> Check Mpesa Agent account balance → Enter
              in "📱 Mpesa (Agent)" below
            </p>
            <p>
              <strong>Step 3:</strong> Check Mpesa Phone (Till) balance → Enter
              in "☎️ Mpesa Phone (Till Number)" below
            </p>
            <p>
              <strong>Step 4:</strong> If you brought extra money or paid
              expenses, enter in Deposits/Expenses
            </p>
            <p className="text-amber-300 mt-3">
              <strong>⚠️ Important:</strong> Enter the TOTAL amount you have now
              (not just today's sales)
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">
              💰 Enter Counted Amounts
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              System shows expected from sales, you enter what you actually have
            </p>
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
                    name: "💵 Cash",
                    expected: salesTotals?.Cash || 0,
                    actual: actualCash,
                    setActual: setActualCash,
                  },
                  {
                    name: "📱 Mpesa Agent",
                    expected: salesTotals?.Mpesa || 0,
                    actual: actualMpesa,
                    setActual: setActualMpesa,
                  },
                  {
                    name: "☎️ Mpesa Phone (Till)",
                    expected: salesTotals?.["Till Number"] || 0,
                    actual: actualTillNumber,
                    setActual: setActualTillNumber,
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

        {/* Today's Deposits and Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Deposits */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
            <label className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Today's Deposits
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={todayDeposits}
              onChange={(e) => setTodayDeposits(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-xl font-semibold focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-green-300 mt-2">
              💰 Extra money brought in today (not from sales - e.g., owner
              deposit, bank withdrawal)
            </p>
          </div>

          {/* Expenses */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
            <label className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <TrendingDown className="w-6 h-6" />
              Today's Expenses
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={todayExpenses}
              onChange={(e) => setTodayExpenses(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-xl font-semibold focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-sm text-amber-300 mt-2">
              💸 Money taken out today (not sales - e.g., rent paid, utilities,
              supplies)
            </p>
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

        {/* New Balance Preview */}
        <div className="mb-6 bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-2 border-emerald-500/50 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            📊 New Closing Balance Preview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Cash Balance</p>
              <p className="text-2xl font-bold text-green-400">
                KES{" "}
                {(
                  parseFloat(actualCash || "0") +
                  parseFloat(todayDeposits || "0") -
                  parseFloat(todayExpenses || "0")
                ).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {parseFloat(actualCash || "0").toLocaleString()} counted
                {parseFloat(todayDeposits || "0") > 0 &&
                  ` + ${parseFloat(todayDeposits).toLocaleString()} deposits`}
                {parseFloat(todayExpenses || "0") > 0 &&
                  ` - ${parseFloat(todayExpenses).toLocaleString()} expenses`}
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Mpesa Agent</p>
              <p className="text-2xl font-bold text-blue-400">
                KES {parseFloat(actualMpesa || "0").toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">As counted</p>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Mpesa Phone</p>
              <p className="text-2xl font-bold text-purple-400">
                KES {parseFloat(actualTillNumber || "0").toLocaleString()}
              </p>
              <p className="text-xs text-slate-400 mt-2">As counted</p>
            </div>
          </div>
          <p className="text-sm text-emerald-300 mt-4">
            💡 These will be your starting balances for tomorrow
          </p>
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
              const message = document.createElement("div");
              message.className =
                "fixed top-4 right-4 bg-amber-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50";
              message.innerHTML =
                '<div class="font-bold">⚠️ Please enter your name in "Reconciled By" field</div>';
              document.body.appendChild(message);
              setTimeout(() => message.remove(), 3000);
              return;
            }

            const statusText =
              varianceTotal === 0
                ? "BALANCED"
                : varianceTotal > 0
                ? "OVER"
                : "SHORT";
            const confirmDiv = document.createElement("div");
            confirmDiv.className =
              "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50";
            confirmDiv.innerHTML = `
              <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl p-6 max-w-md">
                <div class="text-center mb-6">
                  <div class="text-4xl mb-3">${
                    varianceTotal === 0 ? "✅" : varianceTotal > 0 ? "📈" : "📉"
                  }</div>
                  <h3 class="text-2xl font-bold text-white mb-2">Confirm Save</h3>
                  <p class="text-slate-300">Save reconciliation with <span class="font-bold ${
                    varianceTotal === 0
                      ? "text-green-400"
                      : varianceTotal > 0
                      ? "text-blue-400"
                      : "text-red-400"
                  }">${statusText}</span> status?</p>
                </div>
                <div class="flex gap-3">
                  <button id="confirm-yes" class="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700">
                    Yes, Save
                  </button>
                  <button id="confirm-no" class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold">
                    Cancel
                  </button>
                </div>
              </div>
            `;
            document.body.appendChild(confirmDiv);

            document
              .getElementById("confirm-yes")
              ?.addEventListener("click", () => {
                confirmDiv.remove();
                saveMutation.mutate();
              });

            document
              .getElementById("confirm-no")
              ?.addEventListener("click", () => {
                confirmDiv.remove();
              });
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold text-white">
                {cashBalance === 0 ? "Set Initial Balances" : "Update Balances"}
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-slate-300 mb-4">
                {cashBalance === 0
                  ? "🏪 Enter your current balances to start tracking"
                  : "💰 Update your current balances"}
              </p>

              {/* Cash Balance */}
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">
                  💵 Cash Balance *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialCashBalance}
                  onChange={(e) => setInitialCashBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 text-lg font-semibold"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">
                  Current: KES {cashBalance.toLocaleString()}
                </p>
              </div>

              {/* Mpesa Agent Balance */}
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-2">
                  📱 Mpesa Agent Balance *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialMpesaAgentBalance}
                  onChange={(e) => setInitialMpesaAgentBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Current: KES {mpesaAgentBalance.toLocaleString()}
                </p>
              </div>

              {/* Mpesa Phone Balance */}
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                  ☎️ Mpesa Phone Balance *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={initialMpesaPhoneBalance}
                  onChange={(e) => setInitialMpesaPhoneBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Current: KES {mpesaPhoneBalance.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const cash = parseFloat(initialCashBalance);
                  const agent = parseFloat(initialMpesaAgentBalance);
                  const phone = parseFloat(initialMpesaPhoneBalance);

                  if (
                    isNaN(cash) ||
                    cash < 0 ||
                    isNaN(agent) ||
                    agent < 0 ||
                    isNaN(phone) ||
                    phone < 0
                  ) {
                    const message = document.createElement("div");
                    message.className =
                      "fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50";
                    message.innerHTML =
                      '<div class="font-bold">⚠️ Please enter valid amounts for all balances</div>';
                    document.body.appendChild(message);
                    setTimeout(() => message.remove(), 3000);
                    return;
                  }

                  // Update database
                  await supabase
                    .from("store_balances" as any)
                    .update({
                      cash_balance: cash,
                      mpesa_agent_balance: agent,
                      mpesa_phone_balance: phone,
                    })
                    .eq("id", (storeBalances as any)?.id);

                  // Invalidate query to refetch
                  queryClient.invalidateQueries({
                    queryKey: ["store-balances"],
                  });

                  setShowBalanceModal(false);
                  setInitialCashBalance("");
                  setInitialMpesaAgentBalance("");
                  setInitialMpesaPhoneBalance("");

                  const message = document.createElement("div");
                  message.className =
                    "fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl z-50";
                  message.innerHTML = `
                    <div class="font-bold text-lg mb-2">✅ Balances ${
                      cashBalance === 0 ? "Set" : "Updated"
                    }!</div>
                    <div class="text-sm space-y-1">
                      <div>💵 Cash: KES ${cash.toLocaleString()}</div>
                      <div>📱 Agent: KES ${agent.toLocaleString()}</div>
                      <div>☎️ Phone: KES ${phone.toLocaleString()}</div>
                    </div>
                  `;
                  document.body.appendChild(message);
                  setTimeout(() => message.remove(), 4000);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
              >
                {cashBalance === 0 ? "Set Balances" : "Update Balances"}
              </button>
              {cashBalance !== 0 && (
                <button
                  onClick={() => {
                    setShowBalanceModal(false);
                    setInitialCashBalance("");
                    setInitialMpesaAgentBalance("");
                    setInitialMpesaPhoneBalance("");
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
              )}
            </div>

            {cashBalance === 0 && (
              <p className="text-amber-300 text-sm mt-4 text-center">
                ⚠️ You must set initial balances to continue
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
