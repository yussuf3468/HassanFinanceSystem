import { useState, useEffect } from "react";
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Percent,
  BarChart3,
  PiggyBank,
  Save,
  History,
  Trash2,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateFormatter";

interface ProfitResults {
  pureProfit: number;
  netProfit: number;
  capitalComparison: number;
  investorPercentage: number;
  investorProfitShare: number;
}

interface HistoryEntry {
  id: string;
  initial_investment: number;
  current_stock: number;
  total_sales: number;
  cash: number;
  machines: number;
  expenses: number;
  debts: number;
  investor_amount: number;
  pure_profit: number;
  net_profit: number;
  capital_comparison: number;
  investor_percentage: number;
  investor_profit_share: number;
  notes: string | null;
  calculation_date: string;
  created_by: string | null;
  created_at: string;
}

export default function BusinessProfitTracker() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    initialInvestment: "",
    currentStock: "",
    totalSales: "",
    cash: "",
    machines: "",
    expenses: "",
    debts: "",
    investorAmount: "",
    notes: "",
  });

  const [results, setResults] = useState<ProfitResults | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("profit_tracker_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const calculateProfit = () => {
    const initialInvestment = parseFloat(formData.initialInvestment) || 0;
    const currentStock = parseFloat(formData.currentStock) || 0;
    const totalSales = parseFloat(formData.totalSales) || 0;
    const cash = parseFloat(formData.cash) || 0;
    const machines = parseFloat(formData.machines) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const debts = parseFloat(formData.debts) || 0;
    const investorAmount = parseFloat(formData.investorAmount) || 0;

    // Pure Profit = (totalSales + currentStock) − initialInvestment
    const pureProfit = totalSales + currentStock - initialInvestment;

    // Net Profit = (totalSales + currentStock + machines) − (initialInvestment + expenses + debts)
    const netProfit =
      totalSales +
      currentStock +
      machines -
      (initialInvestment + expenses + debts);

    // Capital Comparison = (currentStock + cash + machines) − initialInvestment
    const capitalComparison =
      currentStock + cash + machines - initialInvestment;

    // Investor Percentage = (investorAmount ÷ initialInvestment) × 100
    const investorPercentage =
      initialInvestment > 0 ? (investorAmount / initialInvestment) * 100 : 0;

    // Investor Profit Share = (Investor Percentage ÷ 100) × Net Profit
    const investorProfitShare = (investorPercentage / 100) * netProfit;

    setResults({
      pureProfit,
      netProfit,
      capitalComparison,
      investorPercentage,
      investorProfitShare,
    });
  };

  const saveToHistory = async () => {
    if (!results) return;

    setSaveStatus("saving");
    setLoading(true);

    try {
      const { error } = await supabase.from("profit_tracker_history").insert({
        initial_investment: parseFloat(formData.initialInvestment) || 0,
        current_stock: parseFloat(formData.currentStock) || 0,
        total_sales: parseFloat(formData.totalSales) || 0,
        cash: parseFloat(formData.cash) || 0,
        machines: parseFloat(formData.machines) || 0,
        expenses: parseFloat(formData.expenses) || 0,
        debts: parseFloat(formData.debts) || 0,
        investor_amount: parseFloat(formData.investorAmount) || 0,
        pure_profit: results.pureProfit,
        net_profit: results.netProfit,
        capital_comparison: results.capitalComparison,
        investor_percentage: results.investorPercentage,
        investor_profit_share: results.investorProfitShare,
        notes: formData.notes || null,
        created_by: user?.email || null,
      });

      if (error) throw error;

      setSaveStatus("success");
      await loadHistory();

      // Reset success message after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving to history:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this calculation?")) return;

    try {
      const { error } = await supabase
        .from("profit_tracker_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadHistory();
    } catch (error) {
      console.error("Error deleting history entry:", error);
      alert("Failed to delete entry");
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setFormData({
      initialInvestment: entry.initial_investment.toString(),
      currentStock: entry.current_stock.toString(),
      totalSales: entry.total_sales.toString(),
      cash: entry.cash.toString(),
      machines: entry.machines.toString(),
      expenses: entry.expenses.toString(),
      debts: entry.debts.toString(),
      investorAmount: entry.investor_amount.toString(),
      notes: entry.notes || "",
    });

    setResults({
      pureProfit: entry.pure_profit,
      netProfit: entry.net_profit,
      capitalComparison: entry.capital_comparison,
      investorPercentage: entry.investor_percentage,
      investorProfitShare: entry.investor_profit_share,
    });

    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-8 relative">
          {/* Background Glow Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/30 via-teal-100/30 to-emerald-100/30 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white dark:bg-slate-800 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-emerald-100/50 dark:border-slate-700 overflow-hidden">
            {/* Animated Background Patterns */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full animate-pulse transform rotate-45"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-emerald-500 to-teal-400 rounded-full animate-pulse transform rotate-12 animation-delay-1000"></div>
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-sm opacity-60 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
                      <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-4xl font-black text-slate-800 dark:text-white">
                      📊 Business Profit Tracker
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-semibold">
                      Xisaabinta Faa'iidada Ganacsiga - Calculate Business
                      Profits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Input Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              Enter Business Data
            </h2>

            <div className="space-y-4 sm:space-y-5">
              {/* Initial Investment */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Initial Investment (Maalgelinta Hore)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="initialInvestment"
                    value={formData.initialInvestment}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Current Stock */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Current Stock Value
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Total Sales */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Total Sales
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="totalSales"
                    value={formData.totalSales}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Cash */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Cash on Hand
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="cash"
                    value={formData.cash}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Machines */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Machines/Equipment
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="machines"
                    value={formData.machines}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Expenses */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Total Expenses
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="expenses"
                    value={formData.expenses}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Debts */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Outstanding Debts
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="debts"
                    value={formData.debts}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Investor Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Investor Amount
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Percent className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="investorAmount"
                    value={formData.investorAmount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes (Optional) - Qoraalka
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 text-slate-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Add any notes about this calculation..."
                    rows={3}
                    className="w-full pl-11 pr-4 py-2 sm:py-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={calculateProfit}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Calculator className="w-6 h-6" />
                  Calculate Profit
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <History className="w-5 h-5" />
                  {showHistory ? "Hide History" : "View History"} (
                  {history.length})
                </button>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="space-y-4 sm:space-y-6">
            {results ? (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    Profit Analysis Results
                  </h2>

                  <div className="space-y-4">
                    {/* Pure Profit */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border-2 border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-emerald-700">
                          Pure Profit
                        </span>
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">
                        {formatKES(results.pureProfit)}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">
                        Sales + Stock - Investment
                      </p>
                    </div>

                    {/* Net Profit */}
                    <div
                      className={`p-5 rounded-xl border-2 ${
                        results.netProfit >= 0
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                          : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-semibold ${
                            results.netProfit >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          Net Profit (Faa'iidada Dhabta)
                        </span>
                        {results.netProfit >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                        )}
                      </div>
                      <p
                        className={`text-3xl font-bold ${
                          results.netProfit >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {formatKES(results.netProfit)}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          results.netProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        After all expenses and debts
                      </p>
                    </div>

                    {/* Capital Comparison */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-700">
                          Capital Comparison
                        </span>
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-blue-700">
                        {formatKES(results.capitalComparison)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Current assets vs initial investment
                      </p>
                    </div>

                    {/* Investor Section */}
                    {parseFloat(formData.investorAmount) > 0 && (
                      <>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-700">
                              Investor Ownership (Qayb Maalgaliye)
                            </span>
                            <Percent className="w-5 h-5 text-purple-600" />
                          </div>
                          <p className="text-3xl font-bold text-purple-700">
                            {results.investorPercentage.toFixed(2)}%
                          </p>
                          <p className="text-xs text-purple-600 mt-1">
                            Ownership percentage
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border-2 border-amber-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-amber-700">
                              Investor Profit Share (Qayb Faa'iido)
                            </span>
                            <DollarSign className="w-5 h-5 text-amber-600" />
                          </div>
                          <p className="text-3xl font-bold text-amber-700">
                            {formatKES(results.investorProfitShare)}
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            Based on ownership percentage
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="mt-6 pt-6 border-t-2 border-slate-100">
                    <button
                      onClick={saveToHistory}
                      disabled={loading || saveStatus === "saving"}
                      className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                        saveStatus === "success"
                          ? "bg-green-500 text-white"
                          : saveStatus === "error"
                          ? "bg-red-500 text-white"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {saveStatus === "saving" && (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      )}
                      {saveStatus === "success" && (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Saved Successfully!
                        </>
                      )}
                      {saveStatus === "error" && (
                        <>
                          <AlertCircle className="w-5 h-5" />
                          Failed to Save
                        </>
                      )}
                      {saveStatus === "idle" && (
                        <>
                          <Save className="w-5 h-5" />
                          Save to History
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Formula Reference Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    📊 Calculation Formulas
                  </h3>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div>
                      <p className="font-semibold text-emerald-400">
                        Pure Profit:
                      </p>
                      <p className="font-mono text-xs">
                        (Total Sales + Current Stock) - Initial Investment
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-400">
                        Net Profit:
                      </p>
                      <p className="font-mono text-xs">
                        (Total Sales + Current Stock + Machines) - (Initial
                        Investment + Expenses + Debts)
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-400">
                        Capital Comparison:
                      </p>
                      <p className="font-mono text-xs">
                        (Current Stock + Cash + Machines) - Initial Investment
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-400">
                        Investor Percentage:
                      </p>
                      <p className="font-mono text-xs">
                        (Investor Amount ÷ Initial Investment) × 100
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-amber-400">
                        Investor Profit Share:
                      </p>
                      <p className="font-mono text-xs">
                        (Investor Percentage ÷ 100) × Net Profit
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-700 dark:text-white mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  Fill in your business data and click "Calculate Profit" to see
                  your results
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="mt-4 sm:mt-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Calculation History ({history.length})
                </h2>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    No history yet
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Calculate and save your first profit analysis
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 sm:p-5 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-700">
                              {formatDate(entry.calculation_date)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(entry.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                              "{entry.notes}"
                            </p>
                          )}
                          {entry.created_by && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              By: {entry.created_by}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadFromHistory(entry)}
                            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteHistoryEntry(entry.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Mini Results Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                          <p className="text-xs text-emerald-700 font-semibold mb-1">
                            Pure Profit
                          </p>
                          <p className="text-sm font-bold text-emerald-800">
                            {formatKES(entry.pure_profit)}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-lg border ${
                            entry.net_profit >= 0
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <p
                            className={`text-xs font-semibold mb-1 ${
                              entry.net_profit >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            Net Profit
                          </p>
                          <p
                            className={`text-sm font-bold ${
                              entry.net_profit >= 0
                                ? "text-green-800"
                                : "text-red-800"
                            }`}
                          >
                            {formatKES(entry.net_profit)}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-semibold mb-1">
                            Capital Comp.
                          </p>
                          <p className="text-sm font-bold text-blue-800">
                            {formatKES(entry.capital_comparison)}
                          </p>
                        </div>
                        {entry.investor_amount > 0 && (
                          <>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-700 font-semibold mb-1">
                                Investor %
                              </p>
                              <p className="text-sm font-bold text-purple-800">
                                {entry.investor_percentage.toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                              <p className="text-xs text-amber-700 font-semibold mb-1">
                                Investor Share
                              </p>
                              <p className="text-sm font-bold text-amber-800">
                                {formatKES(entry.investor_profit_share)}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
