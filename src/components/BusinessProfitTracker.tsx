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
  Wallet,
  ShoppingBag,
  Users,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/dateFormatter";

interface ProfitResults {
  // Mapped fields:
  // pureProfit -> realProfit
  // netProfit -> netWorth
  // capitalComparison -> totalAssets
  pureProfit: number;
  netProfit: number;
  capitalComparison: number;
  investorOwnership: number;
  investorProfitShare: number;
  status: "Profit" | "Loss";
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
    cash: "",
    debts: "",
    investorAmount: "",
    notes: "",
  });

  const [results, setResults] = useState<ProfitResults | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [localReports, setLocalReports] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
    loadLocalReports();
  }, []);

  const loadLocalReports = () => {
    try {
      const saved = localStorage.getItem("profitReports");
      if (saved) {
        setLocalReports(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading local reports:", error);
    }
  };

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
    const currentStockValue = parseFloat(formData.currentStock) || 0;
    const cashInStore = parseFloat(formData.cash) || 0;
    const outstandingDebts = parseFloat(formData.debts) || 0;
    const investorAmount = parseFloat(formData.investorAmount) || 0;

    // Equipment is assumed to be part of the initial investment and
    // MUST NOT be added again in these calculations.

    // 1) Total assets = currentStockValue + cashInStore
    const totalAssets = currentStockValue + cashInStore;

    // 2) Net worth today = Total assets - outstandingDebts
    const netWorth = totalAssets - outstandingDebts;

    // 3) Real profit = Net worth today - initialInvestment
    const realProfit = netWorth - initialInvestment;

    // 4) Status: Profit or Loss
    const status: "Profit" | "Loss" = realProfit >= 0 ? "Profit" : "Loss";

    // Optional: investor view based on real profit
    const investorOwnership =
      initialInvestment > 0 ? (investorAmount / initialInvestment) * 100 : 0;
    const investorProfitShare = (investorOwnership / 100) * realProfit;

    // Console explanation with formatted numbers
    const fmt = (n: number) =>
      n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

    // Clear, step‑by‑step explanation
    // Note: totalSales and totalExpenses are shown for context but
    // the real profit here is based on current assets vs initial capital.
    console.log(
      "[Shop Real Profit Calculation]" +
        "\n" +
        `Initial investment: KES ${fmt(initialInvestment)}` +
        "\n" +
        `Current stock value: KES ${fmt(currentStockValue)}` +
        "\n" +
        `Cash in store: KES ${fmt(cashInStore)}` +
        "\n" +
        `Outstanding debts: KES ${fmt(outstandingDebts)}` +
        "\n" +
        `Total assets = stock + cash = KES ${fmt(
          currentStockValue,
        )} + KES ${fmt(cashInStore)} = KES ${fmt(totalAssets)}` +
        "\n" +
        `Net worth today = total assets - debts = KES ${fmt(
          totalAssets,
        )} - KES ${fmt(outstandingDebts)} = KES ${fmt(netWorth)}` +
        "\n" +
        `Real profit = net worth today - initial investment = KES ${fmt(
          netWorth,
        )} - KES ${fmt(initialInvestment)} = KES ${fmt(realProfit)}` +
        "\n" +
        `Status: ${status} (the shop is ${
          status === "Profit" ? "above" : "below"
        } the original capital by KES ${fmt(Math.abs(realProfit))})`,
    );

    setResults({
      // Map new meanings into existing fields used by the UI
      // pureProfit  -> realProfit
      // netProfit   -> netWorth
      // capitalComparison -> totalAssets
      pureProfit: realProfit,
      netProfit: netWorth,
      capitalComparison: totalAssets,
      investorOwnership,
      investorProfitShare,
      status,
    });

    // Save to localStorage
    const reportData = {
      timestamp: new Date().toISOString(),
      inputs: formData,
      results: {
        pureProfit: realProfit,
        netProfit: netWorth,
        capitalComparison: totalAssets,
        investorOwnership,
        investorProfitShare,
        status,
      },
    };

    const savedReports = JSON.parse(
      localStorage.getItem("profitReports") || "[]",
    );
    savedReports.unshift(reportData);
    // Keep only last 50 reports
    if (savedReports.length > 50) savedReports.pop();
    localStorage.setItem("profitReports", JSON.stringify(savedReports));
    loadLocalReports(); // Refresh local reports view
  };

  const saveToHistory = async () => {
    if (!results) return;

    try {
      const { error } = await supabase
        .from("profit_tracker_history" as any)
        .insert({
          initial_investment: parseFloat(formData.initialInvestment) || 0,
          current_stock: parseFloat(formData.currentStock) || 0,
          total_sales: 0,
          cash: parseFloat(formData.cash) || 0,
          machines: 0,
          expenses: 0,
          debts: parseFloat(formData.debts) || 0,
          investor_amount: parseFloat(formData.investorAmount) || 0,
          pure_profit: results.pureProfit,
          net_profit: results.netProfit,
          capital_comparison: results.capitalComparison,
          investor_percentage: results.investorOwnership,
          investor_profit_share: results.investorProfitShare,
          notes: formData.notes || null,
          created_by: user?.email || null,
        });

      if (error) throw error;
      alert("Saved to cloud history successfully!");
      await loadHistory();
    } catch (error) {
      console.error("Error saving to history:", error);
      alert("Failed to save to cloud history");
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
      currentStock: entry.current_stock.toString(),
      cash: entry.cash.toString(),
      debts: entry.debts.toString(),
      investorAmount: entry.investor_amount.toString(),
      notes: entry.notes || "",
    });

    // Recalculate with loaded data
    calculateProfit();
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveReport = () => {
    if (!results) {
      alert("Please calculate results first!");
      return;
    }
    calculateProfit(); // This will save to localStorage
    alert(
      "Report saved to device! Click 'View History' button to see all saved reports.",
    );
  };

  const deleteLocalReport = (index: number) => {
    if (!confirm("Delete this local report?")) return;
    try {
      const saved = JSON.parse(localStorage.getItem("profitReports") || "[]");
      saved.splice(index, 1);
      localStorage.setItem("profitReports", JSON.stringify(saved));
      loadLocalReports();
    } catch (error) {
      console.error("Error deleting local report:", error);
    }
  };

  const loadFromLocalReport = (report: any) => {
    setFormData({
      initialInvestment: report.inputs.initialInvestment,
      currentStock: report.inputs.currentStock,
      cash: report.inputs.cash,
      debts: report.inputs.debts,
      investorAmount: report.inputs.investorAmount,
      notes: report.inputs.notes,
    });
    setResults(report.results);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const generatePDFReport = () => {
    if (!results) {
      alert("Please calculate results first!");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Shop Profit Analysis Report", pageWidth / 2, yPos, {
      align: "center",
    });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      pageWidth / 2,
      yPos,
      { align: "center" },
    );

    yPos += 15;

    // Business Inputs Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Business Inputs", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const initialInvestment = parseFloat(formData.initialInvestment) || 0;
    const currentStockValue = parseFloat(formData.currentStock) || 0;
    const cashInStore = parseFloat(formData.cash) || 0;
    const outstandingDebts = parseFloat(formData.debts) || 0;
    const investorAmount = parseFloat(formData.investorAmount) || 0;

    const inputsData = [
      ["Initial Investment", formatKES(initialInvestment)],
      ["Current Stock Value", formatKES(currentStockValue)],
      ["Cash in Store/M-Pesa", formatKES(cashInStore)],
      ["Outstanding Debts", formatKES(outstandingDebts)],
      ["Investor Amount", formatKES(investorAmount)],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [["Input", "Amount"]],
      body: inputsData,
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Profit Analysis Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Profit Analysis Results", 14, yPos);
    yPos += 8;

    const totalAssets = results.capitalComparison;
    const netWorth = results.netProfit;
    const realProfit = results.pureProfit;

    const resultsData = [
      ["Total Assets", formatKES(totalAssets), "Stock + Cash"],
      ["Net Worth", formatKES(netWorth), "Assets - Debts"],
      ["Real Profit", formatKES(realProfit), "Net Worth - Investment"],
      ["Status", results.status, realProfit >= 0 ? "✓ Profitable" : "✗ Loss"],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [["Metric", "Amount", "Calculation"]],
      body: resultsData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      bodyStyles: {
        cellPadding: 3,
      },
      columnStyles: {
        2: { fontStyle: "italic", textColor: [100, 100, 100] },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Explanation Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Explanation", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const explanations = [
      "1. TOTAL ASSETS CALCULATION:",
      `   Current Stock: ${formatKES(currentStockValue)}`,
      `   Cash in Store: ${formatKES(cashInStore)}`,
      `   Total Assets = ${formatKES(totalAssets)}`,
      "",
      "2. NET WORTH CALCULATION:",
      `   Total Assets: ${formatKES(totalAssets)}`,
      `   Outstanding Debts: ${formatKES(outstandingDebts)}`,
      `   Net Worth = ${formatKES(netWorth)}`,
      "",
      "3. REAL PROFIT CALCULATION:",
      `   Net Worth Today: ${formatKES(netWorth)}`,
      `   Initial Investment: ${formatKES(initialInvestment)}`,
      `   Real Profit = ${formatKES(realProfit)}`,
      "",
      "INTERPRETATION:",
      realProfit >= 0
        ? `✓ Your business is PROFITABLE! You have gained ${formatKES(
            Math.abs(realProfit),
          )} above your initial investment.`
        : `✗ Your business is at a LOSS. You are ${formatKES(
            Math.abs(realProfit),
          )} below your initial investment.`,
    ];

    explanations.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += 6;
    });

    // Why This Happened Section
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Why This Happened", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const reasons = [];

    if (realProfit > 0) {
      reasons.push("POSITIVE FACTORS:");
      if (currentStockValue > initialInvestment * 0.7) {
        reasons.push("• Strong inventory value maintained");
      }
      if (cashInStore > initialInvestment * 0.3) {
        reasons.push("• Good cash flow generation");
      }
      if (outstandingDebts < initialInvestment * 0.2) {
        reasons.push("• Low debt burden");
      }
      reasons.push("• Effective business operations");
      reasons.push("• Positive return on investment");
    } else {
      reasons.push("CHALLENGES IDENTIFIED:");
      if (currentStockValue < initialInvestment * 0.5) {
        reasons.push("• Inventory value has decreased significantly");
      }
      if (cashInStore < initialInvestment * 0.2) {
        reasons.push("• Low cash reserves");
      }
      if (outstandingDebts > initialInvestment * 0.3) {
        reasons.push("• High debt burden affecting net worth");
      }
      if (totalAssets < initialInvestment) {
        reasons.push("• Total business assets below initial capital");
      }
    }

    reasons.forEach((line) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 14, yPos);
      yPos += 6;
    });

    // Investor Information (if applicable)
    if (investorAmount > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Investor Information", 14, yPos);
      yPos += 8;

      const investorData = [
        ["Investor Investment", formatKES(investorAmount)],
        ["Ownership Percentage", `${results.investorOwnership.toFixed(2)}%`],
        ["Profit Share", formatKES(results.investorProfitShare)],
      ];

      (doc as any).autoTable({
        startY: yPos,
        head: [["Investor Metric", "Value"]],
        body: investorData,
        theme: "striped",
        headStyles: { fillColor: [168, 85, 247] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Investor owns ${results.investorOwnership.toFixed(
          2,
        )}% of the business and`,
        14,
        yPos,
      );
      yPos += 5;
      doc.text(
        `${
          results.investorProfitShare >= 0 ? "gains" : "shares the loss of"
        } ${formatKES(Math.abs(results.investorProfitShare))}`,
        14,
        yPos,
      );
    }

    // Notes Section
    if (formData.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, yPos);
      yPos += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      const splitNotes = doc.splitTextToSize(formData.notes, pageWidth - 28);
      splitNotes.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 14, yPos);
        yPos += 5;
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount} | Hassan Bookshop Profit Tracker`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    // Save the PDF
    const fileName = `Profit_Report_${
      new Date().toISOString().split("T")[0]
    }_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">
                🛒 Shop Profit Calculator
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track your business performance - Real-time profit tracking
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Desktop side-by-side, Mobile stacked */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Business Inputs */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Business Inputs
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold shadow-md"
              >
                <History className="w-4 h-4" />
                View History ({history.length + localReports.length})
              </button>
            </div>

            <div className="space-y-4">
              {/* Initial Investment */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Initial Investment (KES)
                </label>
                <input
                  type="text"
                  name="initialInvestment"
                  value={formData.initialInvestment}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                />
              </div>

              {/* Current Stock Value */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Current Stock Value (KES)
                </label>
                <input
                  type="text"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                />
              </div>

              {/* Cash in Store / M-Pesa */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Cash in Store / M-Pesa (KES)
                </label>
                <input
                  type="text"
                  name="cash"
                  value={formData.cash}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                />
              </div>

              {/* Outstanding Debts */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Outstanding Debts (KES)
                </label>
                <input
                  type="text"
                  name="debts"
                  value={formData.debts}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                />
              </div>

              {/* Investor Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Investor Amount (KES)
                </label>
                <input
                  type="text"
                  name="investorAmount"
                  value={formData.investorAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-medium"
                />
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Notes / Observations
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any observations or comments..."
                  rows={3}
                  className="w-full px-4 py-2.5 border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base resize-none"
                />
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateProfit}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-lg font-bold text-lg hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Calculator className="w-6 h-6" />
                Calculate Profit
              </button>
            </div>
          </div>

          {/* Right Column: Results Summary */}
          <div className="space-y-6">
            {results ? (
              <>
                {/* Results Header */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      Results Summary
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={saveReport}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 font-semibold text-sm"
                      >
                        <Save className="w-4 h-4" />
                        Save Report
                      </button>
                      <button
                        onClick={saveToHistory}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold text-sm"
                      >
                        <History className="w-4 h-4" />
                        Cloud Save
                      </button>
                      <button
                        onClick={generatePDFReport}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 font-semibold text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        PDF Report
                      </button>
                    </div>
                  </div>

                  {/* Pure Profit */}
                  <div
                    className={`rounded-xl p-5 mb-4 border-2 ${
                      results.pureProfit >= 0
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Pure Profit
                        </p>
                        <p
                          className={`text-3xl font-bold ${
                            results.pureProfit >= 0
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {formatKES(results.pureProfit)}
                        </p>
                      </div>
                      {results.pureProfit >= 0 ? (
                        <TrendingUp className="w-10 h-10 text-green-600" />
                      ) : (
                        <TrendingDown className="w-10 h-10 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      (Sales + Stock) - Initial Investment
                    </p>
                  </div>

                  {/* Net Profit */}
                  <div
                    className={`rounded-xl p-5 mb-4 border-2 ${
                      results.netProfit >= 0
                        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Net Profit (After Expenses & Debts)
                        </p>
                        <p
                          className={`text-3xl font-bold ${
                            results.netProfit >= 0
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {formatKES(results.netProfit)}
                        </p>
                      </div>
                      {results.netProfit >= 0 ? (
                        <TrendingUp className="w-10 h-10 text-green-600" />
                      ) : (
                        <TrendingDown className="w-10 h-10 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      (Sales + Stock + Equipment) - (Investment + Expenses +
                      Debts)
                    </p>
                  </div>

                  {/* Capital Comparison */}
                  <div
                    className={`rounded-xl p-5 mb-4 border-2 ${
                      results.capitalComparison >= 0
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800"
                        : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Capital Comparison (Father's Logic)
                        </p>
                        <p
                          className={`text-3xl font-bold ${
                            results.capitalComparison >= 0
                              ? "text-blue-700 dark:text-blue-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {formatKES(results.capitalComparison)}
                        </p>
                      </div>
                      <Wallet
                        className={`w-10 h-10 ${
                          results.capitalComparison >= 0
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      (Stock + Cash + Equipment) - Initial Investment
                    </p>
                  </div>

                  {/* Investor Section */}
                  {parseFloat(formData.investorAmount) > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        Investor Information
                      </h3>

                      {/* Investor Ownership */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 mb-3 border-2 border-purple-300 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Investor Ownership
                            </p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                              {results.investorOwnership.toFixed(2)}%
                            </p>
                          </div>
                          <Percent className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          (Investor Amount ÷ Initial Investment) × 100
                        </p>
                      </div>

                      {/* Investor Profit Share */}
                      <div
                        className={`rounded-xl p-5 border-2 ${
                          results.investorProfitShare >= 0
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800"
                            : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Investor Profit Share
                            </p>
                            <p
                              className={`text-2xl font-bold ${
                                results.investorProfitShare >= 0
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-red-700 dark:text-red-400"
                              }`}
                            >
                              {formatKES(results.investorProfitShare)}
                            </p>
                          </div>
                          <ShoppingBag
                            className={`w-8 h-8 ${
                              results.investorProfitShare >= 0
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                          (Investor Ownership ÷ 100) × Net Profit
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
                  Ready to Calculate
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Fill in your business data and click "Calculate Profit" to see
                  your results
                </p>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="mt-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Calculation History ({history.length +
                    localReports.length}{" "}
                  total)
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold text-sm"
                >
                  Close History
                </button>
              </div>

              {history.length === 0 && localReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <History className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">
                    No history yet
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Calculate and save your first profit analysis
                  </p>
                </div>
              ) : (
                <div className="space-y-6 max-h-[600px] overflow-y-auto">
                  {/* Local Reports Section */}
                  {localReports.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <Save className="w-4 h-4 text-emerald-600" />
                        📱 Device Saved Reports ({localReports.length})
                      </h3>
                      <div className="space-y-4">
                        {localReports.map((report, index) => (
                          <div
                            key={index}
                            className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-emerald-600" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {new Date(
                                      report.timestamp,
                                    ).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(
                                      report.timestamp,
                                    ).toLocaleTimeString()}
                                  </span>
                                  <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-white text-xs rounded-full font-semibold">
                                    LOCAL
                                  </span>
                                </div>
                                {report.inputs.notes && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                                    "{report.inputs.notes}"
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => loadFromLocalReport(report)}
                                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
                                >
                                  Load
                                </button>
                                <button
                                  onClick={() => deleteLocalReport(index)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Mini Results Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg border border-emerald-300 dark:border-emerald-700">
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                  Pure Profit
                                </p>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                  {formatKES(report.results.pureProfit)}
                                </p>
                              </div>
                              <div
                                className={`p-3 rounded-lg border ${
                                  report.results.netProfit >= 0
                                    ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                    : "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                                }`}
                              >
                                <p
                                  className={`text-xs font-semibold mb-1 ${
                                    report.results.netProfit >= 0
                                      ? "text-green-700 dark:text-green-400"
                                      : "text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  Net Profit
                                </p>
                                <p
                                  className={`text-sm font-bold ${
                                    report.results.netProfit >= 0
                                      ? "text-green-800 dark:text-green-300"
                                      : "text-red-800 dark:text-red-300"
                                  }`}
                                >
                                  {formatKES(report.results.netProfit)}
                                </p>
                              </div>
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                                  Capital Comp.
                                </p>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                  {formatKES(report.results.capitalComparison)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cloud History Section */}
                  {history.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-600" />
                        ☁️ Cloud Saved History ({history.length})
                      </h3>
                      <div className="space-y-4">
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {formatDate(entry.calculation_date)}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(
                                      entry.created_at,
                                    ).toLocaleTimeString()}
                                  </span>
                                  <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                    CLOUD
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                                    "{entry.notes}"
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => loadFromHistory(entry)}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                                  Pure Profit
                                </p>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                  {formatKES(entry.pure_profit)}
                                </p>
                              </div>
                              <div
                                className={`p-3 rounded-lg border ${
                                  entry.net_profit >= 0
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                }`}
                              >
                                <p
                                  className={`text-xs font-semibold mb-1 ${
                                    entry.net_profit >= 0
                                      ? "text-green-700 dark:text-green-400"
                                      : "text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  Net Profit
                                </p>
                                <p
                                  className={`text-sm font-bold ${
                                    entry.net_profit >= 0
                                      ? "text-green-800 dark:text-green-300"
                                      : "text-red-800 dark:text-red-300"
                                  }`}
                                >
                                  {formatKES(entry.net_profit)}
                                </p>
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                                  Capital Comp.
                                </p>
                                <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                                  {formatKES(entry.capital_comparison)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
