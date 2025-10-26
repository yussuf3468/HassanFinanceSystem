import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  TrendingDown,
} from "lucide-react";
import { useExpenses } from "../hooks/useSupabaseQuery";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";
import DatabaseSetupNotice from "./DatabaseSetupNotice.tsx";
import ModalPortal from "./ModalPortal.tsx";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

type DbExpense = Database["public"]["Tables"]["expenses"]["Row"];
type DbCategory = Database["public"]["Tables"]["expense_categories"]["Row"];

interface ExpenseUI {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

interface ExpenseForm {
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export default function ExpenseManagement() {
  const { data: expensesData = [] } = useExpenses();
  const [expenses, setExpenses] = useState<ExpenseUI[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseUI | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [tablesExist, setTablesExist] = useState(true);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState<ExpenseForm>({
    category: "",
    description: "",
    amount: 0,
    date: getCurrentDateForInput(),
    notes: "",
  });

  const categoryNameToId = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      if (c.name) map.set(c.name, c.id);
    });
    return map;
  }, [categories]);

  const categoryIdToName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => {
      if (c.id) map.set(c.id, c.name || "");
    });
    return map;
  }, [categories]);

  // Recompute UI expenses whenever expensesData, selectedMonth or category mapping changes.
  // Including categoryIdToName in deps ensures names appear once categories are loaded.
  useEffect(() => {
    if (expensesData.length === 0) {
      setExpenses([]);
      return;
    }

    const startDate = selectedMonth + "-01";
    const endDate = new Date(selectedMonth + "-01");
    endDate.setMonth(endDate.getMonth() + 1);

    const filtered = expensesData.filter((exp) => {
      const expDate = (exp as any).incurred_on as string | undefined;
      if (!expDate) return false;
      return (
        expDate >= startDate && expDate < endDate.toISOString().split("T")[0]
      );
    });

    // Map DB rows to UI model so fields like category/description/date match what the UI expects
    const mapped: ExpenseUI[] = (filtered as DbExpense[]).map((row) => ({
      id: row.id,
      category: row.category_id
        ? categoryIdToName.get(row.category_id) || ""
        : "",
      description: row.title || "",
      amount: Number(row.amount || 0),
      date: (row.incurred_on as unknown as string) || "",
      created_at: (row.created_at as unknown as string) || "",
    }));

    setExpenses(mapped);
  }, [expensesData, selectedMonth, categoryIdToName]);

  async function loadCategoriesAndExpenses() {
    try {
      const startDate = selectedMonth + "-01";
      const endDate = new Date(selectedMonth + "-01");
      endDate.setMonth(endDate.getMonth() + 1);

      const [{ data: cats, error: catErr }, { data, error }] =
        await Promise.all([
          supabase
            .from("expense_categories")
            .select("id, name, description, created_at")
            .order("name", { ascending: true }),
          supabase
            .from("expenses")
            .select("*")
            .gte("incurred_on", startDate)
            .lt("incurred_on", endDate.toISOString().split("T")[0])
            .order("incurred_on", { ascending: false }),
        ]);

      if (catErr) throw catErr;
      setCategories(cats || []);

      if (error) {
        if ((error as any).code === "42P01") {
          console.log(
            "Expenses table not found. Please run the database setup from FINANCIAL_SETUP.md"
          );
          setTablesExist(false);
          setExpenses([]);
          return;
        }
        throw error;
      }

      // Use the freshly fetched categories to map category_id -> name immediately
      const localIdToName = new Map<string, string>();
      (cats || []).forEach((c) => {
        if (c && c.id) localIdToName.set(c.id, c.name || "");
      });

      const mapped: ExpenseUI[] =
        (data as DbExpense[] | null)?.map((row) => ({
          id: row.id,
          category: row.category_id
            ? localIdToName.get(row.category_id) || ""
            : "",
          description: row.title || "",
          amount: Number(row.amount || 0),
          date: (row.incurred_on as unknown as string) || "",
          created_at: (row.created_at as unknown as string) || "",
        })) || [];
      setExpenses(mapped);
    } catch (error) {
      console.error("Error loading expenses:", error);
      setExpenses([]);
    } finally {
    }
  }

  // Load categories and expenses on mount and whenever the selected month changes.
  // This ensures categories are available before the UI mapping runs.
  useEffect(() => {
    loadCategoriesAndExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  async function seedDefaultCategories() {
    try {
      setSeeding(true);
      const defaults = [
        "Rent",
        "Utilities",
        "Salaries",
        "Supplies",
        "Maintenance",
        "Transport",
        "Marketing",
        "Taxes",
        "Bank Charges",
        "Miscellaneous",
      ].map((name) => ({ name, description: null as string | null }));

      // Upsert by unique name to avoid duplicates if re-run
      const { error } = await supabase
        .from("expense_categories")
        .upsert(defaults, { onConflict: "name" });
      if (error) throw error;

      await loadCategoriesAndExpenses();
    } catch (err) {
      console.error("Failed to seed categories:", err);
      alert("Could not seed default categories. See console for details.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const category_id = categoryNameToId.get(formData.category || "");
      const payload: DbExpense = {
        id: "", // will be ignored by DB default
        category_id: category_id || null,
        title: formData.description,
        amount: formData.amount,
        incurred_on: formData.date as unknown as any,
        notes: formData.notes || null,
        created_by: null,
        created_at: new Date().toISOString() as unknown as any,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            category_id: payload.category_id,
            title: payload.title,
            amount: payload.amount,
            incurred_on: payload.incurred_on,
            notes: payload.notes,
          })
          .eq("id", editingExpense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expenses").insert([
          {
            category_id: payload.category_id,
            title: payload.title,
            amount: payload.amount,
            incurred_on: payload.incurred_on,
            notes: payload.notes,
          },
        ]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingExpense(null);
      resetForm();
      await loadCategoriesAndExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense. Please try again.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      await loadCategoriesAndExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  }

  function handleEdit(expense: ExpenseUI) {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      notes: "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      category: "",
      description: "",
      amount: 0,
      date: getCurrentDateForInput(),
      notes: "",
    });
  }
  function closeForm() {
    setShowForm(false);
    setEditingExpense(null);
    resetForm();
  }

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const key = e.category || "Uncategorized";
      map[key] = (map[key] || 0) + (e.amount || 0);
    }
    return map;
  }, [expenses]);

  const averageExpense = useMemo(
    () => (expenses.length ? totalExpenses / expenses.length : 0),
    [expenses, totalExpenses]
  );

  return (
    <>
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Stunning Animated Header */}
        <div className="mb-4 sm:mb-8 relative">
          {/* Background Glow Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-pink-400/20 to-purple-400/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 overflow-hidden">
            {/* Animated Background Patterns */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
              <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse transform rotate-45"></div>
              <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse transform rotate-12 animation-delay-1000"></div>
            </div>

            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl blur-sm opacity-60 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                      <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-bounce" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-pink-200 animate-gradient">
                      💸 Expense Management
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-semibold">
                      Track and analyze all business expenses with style
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-white"
                />

                {categories.length === 0 && (
                  <button
                    type="button"
                    onClick={seedDefaultCategories}
                    disabled={seeding}
                    className="px-3 sm:px-4 py-2 sm:py-3 border border-purple-500/30 bg-purple-500/20 text-purple-300 rounded-lg sm:rounded-xl hover:bg-purple-500/30 transition-all text-sm sm:text-base disabled:opacity-60"
                    title="Insert a set of common expense categories"
                  >
                    {seeding ? "Seeding…" : "Seed Categories"}
                  </button>
                )}

                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Expense</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database Setup Notice */}
        {!tablesExist && (
          <DatabaseSetupNotice message="The expenses table hasn't been created yet. Financial management features require database tables to be set up first." />
        )}

        {/* Stunning Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            className="group relative bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:shadow-red-500/25 transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-red-400 uppercase tracking-wide mb-2">
                  Total Expenses
                </p>
                <p className="text-xl sm:text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                  KES {totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="relative ml-3">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 rounded-xl blur-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <TrendingDown className="w-5 h-5 text-white group-hover:animate-pulse" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div
            className="group relative bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">
                  Total Records
                </p>
                <p className="text-xl sm:text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                  {expenses.length}
                </p>
              </div>
              <div className="relative ml-3">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl blur-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Receipt className="w-5 h-5 text-white group-hover:animate-pulse" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>

          <div
            className="group relative bg-white/10 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-purple-400 uppercase tracking-wide mb-2">
                  Average Expense
                </p>
                <p className="text-xl sm:text-3xl font-black text-white group-hover:scale-105 transition-transform duration-300">
                  KES{" "}
                  {averageExpense.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="relative ml-3">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl blur-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Calendar className="w-5 h-5 text-white group-hover:animate-pulse" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </div>
        </div>
        {/* Stunning Expenses List */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="relative p-4 sm:p-6 border-b border-white/20 bg-white/5 backdrop-blur-xl">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl blur-sm opacity-60 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 p-2 rounded-xl">
                    <Receipt className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200">
                  📊 Expense Records
                </h2>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {expenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                        <p className="text-lg font-medium mb-2 text-white">
                          No expenses recorded
                        </p>
                        <p>Add your first expense to start tracking</p>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {expense.category || "Uncategorized"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-400">
                          KES {expense.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-slate-300 border border-gray-500/30">
                            Expense
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
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

            {/* Mobile Card View */}
            <div className="lg:hidden">
              {expenses.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-lg font-medium mb-2 text-white">
                    No expenses recorded
                  </p>
                  <p className="text-sm">
                    Add your first expense to start tracking
                  </p>
                </div>
              ) : (
                <div className="p-3 sm:p-6 space-y-3">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {expense.category || "Uncategorized"}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-slate-300 border border-gray-500/30">
                              Expense
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white mb-1">
                            {expense.description}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-400 mb-2">
                            KES {expense.amount.toLocaleString()}
                          </p>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-1 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stunning Category Breakdown */}
        {Object.keys(expensesByCategory).length > 0 && (
          <div className="mt-6 sm:mt-8 relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 overflow-hidden">
              {/* Animated Background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse"></div>

              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-sm opacity-60 animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                      <TrendingDown className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200">
                    📈 Expenses by Category
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {Object.entries(expensesByCategory).map(
                    ([category, amount], index) => {
                      const colors = [
                        {
                          from: "from-blue-500",
                          to: "to-blue-600",
                          bg: "from-blue-50",
                          bgTo: "to-blue-100",
                          text: "text-blue-700",
                        },
                        {
                          from: "from-purple-500",
                          to: "to-purple-600",
                          bg: "from-purple-50",
                          bgTo: "to-purple-100",
                          text: "text-purple-700",
                        },
                        {
                          from: "from-pink-500",
                          to: "to-pink-600",
                          bg: "from-pink-50",
                          bgTo: "to-pink-100",
                          text: "text-pink-700",
                        },
                        {
                          from: "from-green-500",
                          to: "to-green-600",
                          bg: "from-green-50",
                          bgTo: "to-green-100",
                          text: "text-green-700",
                        },
                        {
                          from: "from-red-500",
                          to: "to-red-600",
                          bg: "from-red-50",
                          bgTo: "to-red-100",
                          text: "text-red-700",
                        },
                        {
                          from: "from-indigo-500",
                          to: "to-indigo-600",
                          bg: "from-indigo-50",
                          bgTo: "to-indigo-100",
                          text: "text-indigo-700",
                        },
                      ];
                      const colorSet = colors[index % colors.length];

                      return (
                        <div
                          key={category}
                          className="group relative bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative">
                            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                              {category}
                            </p>
                            <p className="text-xl font-black text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                              KES {amount.toLocaleString()}
                            </p>
                            <div className="relative">
                              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${colorSet.from} ${colorSet.to} h-3 rounded-full transition-all duration-1000 ease-out shadow-lg`}
                                  style={{
                                    width: `${(amount / totalExpenses) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 font-medium">
                                {((amount / totalExpenses) * 100).toFixed(1)}%
                                of total
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stunning Add/Edit Expense Modal */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[1000]">
            <div className="relative group">
              {/* Modal Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-white/20">
                {/* Animated Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5">
                  <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-spin-slow"></div>
                </div>

                <div className="relative">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl blur-sm opacity-60 animate-pulse"></div>
                      <div className="relative bg-gradient-to-br from-purple-500 to-blue-600 p-2 rounded-xl">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200">
                      {editingExpense ? "✏️ Edit Expense" : "➕ Add New Expense"}
                    </h3>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                        required
                      >
                        <option value="" disabled className="bg-slate-900 text-white">
                          Select category
                        </option>
                        {/* Allow creating expenses without a category */}
                        <option value="Uncategorized" className="bg-slate-900 text-white">
                          Uncategorized
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name || ""} className="bg-slate-900 text-white">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400"
                        placeholder="Enter expense description"
                        required
                      />
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
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400"
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
                        value={formData.date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-slate-400"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={closeForm}
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-white/20 text-white rounded-lg sm:rounded-xl hover:bg-white/5 transition-colors text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-sm sm:text-base"
                      >
                        {editingExpense ? "Update" : "Add"} Expense
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
