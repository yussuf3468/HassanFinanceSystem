import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Banknote,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Lightbulb,
  Calculator,
  PiggyBank,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import ModalPortal from "./ModalPortal.tsx";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

interface Investment {
  id: string;
  source: string;
  amount: number;
  invested_on: string;
  notes?: string;
  created_at: string;
}

interface InvestmentForm {
  source: string;
  amount: number;
  invested_on: string;
  notes: string;
}

const INVESTMENT_SOURCES = [
  "Initial Capital",
  "Shop Rent Deposit",
  "Equipment & Fixtures",
  "Initial Inventory",
  "Renovation & Setup",
  "Licenses & Permits",
  "Technology & Software",
  "Marketing & Branding",
  "Furniture",
  "Security Systems",
  "Professional Services",
  "Other Setup Costs",
];

export default function InitialInvestment() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null
  );

  const [formData, setFormData] = useState<InvestmentForm>({
    source: "Initial Capital",
    amount: 0,
    invested_on: getCurrentDateForInput(),
    notes: "",
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  async function loadInvestments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("initial_investments")
        .select("*")
        .order("invested_on", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          console.log(
            "Initial investments table not found. Please run the database setup from FINANCIAL_SETUP.md"
          );
          setInvestments([]);
          return;
        }
        throw error;
      }

      const processed: Investment[] = (data || []).map((row: any) => ({
        id: row.id,
        source: row.source,
        amount: Number(row.amount || 0),
        invested_on: row.invested_on as string,
        notes: row.notes || "",
        created_at: row.created_at as string,
      }));
      setInvestments(processed);
    } catch (err) {
      console.error("Error loading investments:", err);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingInvestment) {
        const { error } = await supabase
          .from("initial_investments")
          .update({
            source: formData.source,
            amount: formData.amount,
            invested_on: formData.invested_on,
            notes: formData.notes || null,
          })
          .eq("id", editingInvestment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("initial_investments").insert([
          {
            source: formData.source,
            amount: formData.amount,
            invested_on: formData.invested_on,
            notes: formData.notes || null,
          },
        ]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingInvestment(null);
      resetForm();
      await loadInvestments();
    } catch (err) {
      console.error("Error saving investment:", err);
      alert("Failed to save investment. Please try again.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this investment record?"))
      return;
    try {
      const { error } = await supabase
        .from("initial_investments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadInvestments();
    } catch (err) {
      console.error("Error deleting investment:", err);
    }
  }

  function handleEdit(inv: Investment) {
    setEditingInvestment(inv);
    setFormData({
      source: inv.source,
      amount: inv.amount,
      invested_on: inv.invested_on,
      notes: inv.notes || "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      source: "Initial Capital",
      amount: 0,
      invested_on: getCurrentDateForInput(),
      notes: "",
    });
  }

  function closeForm() {
    setShowForm(false);
    setEditingInvestment(null);
    resetForm();
  }

  const totalInvestment = useMemo(
    () => investments.reduce((sum, i) => sum + i.amount, 0),
    [investments]
  );
  const investmentsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of investments) {
      map[i.source] = (map[i.source] || 0) + i.amount;
    }
    return map;
  }, [investments]);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Initial Capital":
        return <PiggyBank className="w-5 h-5" />;
      case "Shop Rent Deposit":
        return <Building2 className="w-5 h-5" />;
      case "Equipment & Fixtures":
        return <Calculator className="w-5 h-5" />;
      case "Technology & Software":
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading investment records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-white/20 mb-4 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">
                💰 Initial Investment Tracker
              </h1>
              <p className="text-xs sm:text-base text-slate-300">
                Record all startup costs and initial capital for your business
              </p>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Investment</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-emerald-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-emerald-500/30">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-300 mb-1">
                  Total Investment
                </p>
                <p className="text-lg sm:text-3xl font-bold text-white">
                  KES {totalInvestment.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="bg-blue-500/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-blue-500/30">
                <Banknote className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300 mb-1">Investment Items</p>
                <p className="text-3xl font-bold text-white">
                  {investments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-300 mb-1">Sources</p>
                <p className="text-3xl font-bold text-white">
                  {Object.keys(investmentsBySource).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white/10 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden mb-8">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-semibold text-white">
              Investment Records
            </h2>
          </div>

          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Notes
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {investments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <PiggyBank className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                    <p className="text-lg font-medium mb-2">
                      No investments recorded
                    </p>
                    <p>
                      Add your startup costs and initial capital investments
                    </p>
                  </td>
                </tr>
              ) : (
                investments.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {formatDate(inv.invested_on)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-emerald-500/20 p-1 rounded border border-emerald-500/30">
                          {getSourceIcon(inv.source)}
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {inv.source}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {inv.notes || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-400">
                      KES {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {Object.keys(investmentsBySource).length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <h3 className="text-2xl font-semibold text-white mb-6">
              Investment Breakdown by Source
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(investmentsBySource)
                .sort(([, a], [, b]) => b - a)
                .map(([source, amount]) => (
                  <div
                    key={source}
                    className="bg-white/5 backdrop-blur-xl rounded-xl p-4 hover:bg-white/10 transition-colors border border-white/20"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-emerald-500/20 p-1 rounded border border-emerald-500/30">
                        {getSourceIcon(source)}
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        {source}
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-white mb-2">
                      KES {amount.toLocaleString()}
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                        style={{
                          width: `${(amount / totalInvestment) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {((amount / totalInvestment) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[1000]">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-semibold text-white mb-6">
                {editingInvestment ? "Edit Investment" : "Add New Investment"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        source: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  >
                    {INVESTMENT_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.invested_on}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        invested_on: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Additional details about this investment"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-6 py-3 border border-white/20 text-slate-300 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg"
                  >
                    {editingInvestment ? "Update" : "Add"} Investment
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
