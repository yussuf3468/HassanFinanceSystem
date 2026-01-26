import { useState, useEffect } from "react";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart3,
  Save,
  History,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Wallet,
  ShoppingBag,
  CreditCard,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateFormatter";

interface ProfitResults {
  // Assets
  totalAssets: number;
  currentStock: number;
  cashOnHand: number;
  equipment: number;

  // Liabilities
  totalLiabilities: number;
  expenses: number;
  debts: number;

  // Equity
  ownerEquity: number;

  // Profit Metrics
  grossProfit: number; // Revenue - Cost
  netProfit: number; // Gross Profit - Expenses - Debts
  roi: number; // ROI percentage

  // Investor Info
  investorPercentage: number;
  investorShare: number;
  ownerShare: number;
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
    revenue: "", // Total money earned from sales
    costOfGoods: "", // Cost to acquire/produce sold items
    currentStock: "", // Value of inventory on hand
    cash: "", // Cash available
    equipment: "", // Value of machines/equipment
    operatingExpenses: "", // Rent, utilities, salaries, etc.
    debts: "", // Outstanding debts
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
        .from("profit_tracker_history" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data as any) || []);
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
    const revenue = parseFloat(formData.revenue) || 0;
    const costOfGoods = parseFloat(formData.costOfGoods) || 0;
    const currentStock = parseFloat(formData.currentStock) || 0;
    const cash = parseFloat(formData.cash) || 0;
    const equipment = parseFloat(formData.equipment) || 0;
    const operatingExpenses = parseFloat(formData.operatingExpenses) || 0;
    const debts = parseFloat(formData.debts) || 0;
    const investorAmount = parseFloat(formData.investorAmount) || 0;

    // ASSETS (What you have)
    const totalAssets = currentStock + cash + equipment;

    // LIABILITIES (What you owe)
    const totalLiabilities = operatingExpenses + debts;

    // EQUITY (Assets - Liabilities)
    const ownerEquity = totalAssets - totalLiabilities;

    // PROFIT CALCULATIONS
    // Gross Profit = Revenue - Cost of Goods Sold
    const grossProfit = revenue - costOfGoods;

    // Net Profit = Gross Profit - Operating Expenses - Debts
    const netProfit = grossProfit - operatingExpenses - debts;

    // ROI = ((Net Profit + Current Assets) - Initial Investment) / Initial Investment * 100
    const roi =
      initialInvestment > 0
        ? ((netProfit + totalAssets - initialInvestment) / initialInvestment) *
          100
        : 0;

    // INVESTOR CALCULATIONS
    const investorPercentage =
      initialInvestment > 0 ? (investorAmount / initialInvestment) * 100 : 0;

    const investorShare = (investorPercentage / 100) * netProfit;
    const ownerShare = netProfit - investorShare;

    setResults({
      totalAssets,
      currentStock,
      cashOnHand: cash,
      equipment,
      totalLiabilities,
      expenses: operatingExpenses,
      debts,
      ownerEquity,
      grossProfit,
      netProfit,
      roi,
      investorPercentage,
      investorShare,
      ownerShare,
    });
  };

  const saveToHistory = async () => {
    if (!results) return;

    setSaveStatus("saving");
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profit_tracker_history" as any)
        .insert({
          initial_investment: parseFloat(formData.initialInvestment) || 0,
          current_stock: results.currentStock,
          total_sales: parseFloat(formData.revenue) || 0,
          cash: results.cashOnHand,
          machines: results.equipment,
          expenses: results.expenses,
          debts: results.debts,
          investor_amount: parseFloat(formData.investorAmount) || 0,
          pure_profit: results.grossProfit,
          net_profit: results.netProfit,
          capital_comparison: results.ownerEquity,
          investor_percentage: results.investorPercentage,
          investor_profit_share: results.investorShare,
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
        .from("profit_tracker_history" as any)
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
      revenue: entry.total_sales.toString(),
      costOfGoods: "0", // Not stored, default to 0
      currentStock: entry.current_stock.toString(),
      cash: entry.cash.toString(),
      equipment: entry.machines.toString(),
      operatingExpenses: entry.expenses.toString(),
      debts: entry.debts.toString(),
      investorAmount: entry.investor_amount.toString(),
      notes: entry.notes || "",
    });

    // Recalculate with loaded data
    calculateProfit();
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                Business Profit Calculator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Financial Analysis Tool
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Single Column Layout */}
        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Business Inputs
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History ({history.length})
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Investment & Capital */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Investment & Capital
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Investment
                  </label>
                  <input
                    type="text"
                    name="initialInvestment"
                    value={formData.initialInvestment}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Investor Amount
                  </label>
                  <input
                    type="text"
                    name="investorAmount"
                    value={formData.investorAmount}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Revenue & Costs */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Revenue & Costs
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Total Revenue (Sales)
                  </label>
                  <input
                    type="text"
                    name="revenue"
                    value={formData.revenue}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Cost of Goods Sold
                  </label>
                  <input
                    type="text"
                    name="costOfGoods"
                    value={formData.costOfGoods}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Operating Expenses
                  </label>
                  <input
                    type="text"
                    name="operatingExpenses"
                    value={formData.operatingExpenses}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Assets & Liabilities */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Assets & Liabilities
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Current Stock Value
                  </label>
                  <input
                    type="text"
                    name="currentStock"
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Cash on Hand
                  </label>
                  <input
                    type="text"
                    name="cash"
                    value={formData.cash}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipment Value
                  </label>
                  <input
                    type="text"
                    name="equipment"
                    value={formData.equipment}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Outstanding Debts
                  </label>
                  <input
                    type="text"
                    name="debts"
                    value={formData.debts}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any notes..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateProfit}
              className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Calculate Results
            </button>
          </div>

          {/* Results Section */}
          {results && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Financial Analysis
                </h2>
                <button
                  onClick={saveToHistory}
                  disabled={loading || saveStatus === "saving"}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    saveStatus === "success"
                      ? "bg-green-500 text-white"
                      : saveStatus === "error"
                      ? "bg-red-500 text-white"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saveStatus === "saving" && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {saveStatus === "success" && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {saveStatus === "error" && (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {saveStatus === "idle" && <Save className="w-4 h-4" />}
                  {saveStatus === "idle"
                    ? "Save"
                    : saveStatus === "saving"
                    ? "Saving..."
                    : saveStatus === "success"
                    ? "Saved!"
                    : "Error"}
                </button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Gross Profit */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                      Gross Profit
                    </span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatKES(results.grossProfit)}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    Revenue - COGS
                  </p>
                </div>

                {/* Net Profit */}
                <div
                  className={`border-2 rounded-lg p-4 ${
                    results.netProfit >= 0
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        results.netProfit >= 0
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      Net Profit
                    </span>
                    {results.netProfit >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      results.netProfit >= 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {formatKES(results.netProfit)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      results.netProfit >= 0
                        ? "text-green-600 dark:text-green-500"
                        : "text-red-600 dark:text-red-500"
                    }`}
                  >
                    After all expenses
                  </p>
                </div>

                {/* ROI */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                      ROI
                    </span>
                    <Percent className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {results.roi.toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    Return on Investment
                  </p>
                </div>

                {/* Owner Equity */}
                <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                      Owner Equity
                    </span>
                    <Wallet className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {formatKES(results.ownerEquity)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                    Assets - Liabilities
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    Assets
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Current Stock
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatKES(results.currentStock)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Cash on Hand
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatKES(results.cashOnHand)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Equipment
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatKES(results.equipment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-bold">
                      <span className="text-sm text-slate-800 dark:text-slate-200">
                        Total Assets
                      </span>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        {formatKES(results.totalAssets)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-600" />
                    Liabilities
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Operating Expenses
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatKES(results.expenses)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Outstanding Debts
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatKES(results.debts)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 font-bold">
                      <span className="text-sm text-slate-800 dark:text-slate-200">
                        Total Liabilities
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {formatKES(results.totalLiabilities)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Investor Section */}
              {parseFloat(formData.investorAmount) > 0 && (
                <div className="mt-6 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    Profit Distribution
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide block mb-2">
                        Investor Share
                      </span>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                        {formatKES(results.investorShare)}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                        {results.investorPercentage.toFixed(1)}% ownership
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide block mb-2">
                        Owner Share
                      </span>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        {formatKES(results.ownerShare)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {(100 - results.investorPercentage).toFixed(1)}%
                        ownership
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wide block mb-2">
                        Total Net Profit
                      </span>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-200">
                        {formatKES(results.netProfit)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">
                        To be distributed
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
