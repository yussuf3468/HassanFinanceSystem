import { useState, useMemo } from "react";
import {
  Users,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { useSales } from "../hooks/useSupabaseQuery";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateSalesCaches } from "../utils/cacheInvalidation";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CustomerBalance {
  customer_name: string;
  total_sales: number;
  total_paid: number;
  outstanding_balance: number;
  transaction_count: number;
  last_transaction_date: string;
  payment_status: "partial" | "not_paid" | "mixed";
}

export default function CustomerBalances() {
  const queryClient = useQueryClient();
  const { data: sales = [], isLoading } = useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"balance" | "name" | "date">("balance");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get customer transactions
  const getCustomerTransactions = (customerName: string) => {
    return sales
      .filter((sale) => sale.customer_name === customerName)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  };

  // Delete all customer transactions
  const handleDeleteCustomer = async (customerName: string) => {
    const transactions = getCustomerTransactions(customerName);
    if (
      !confirm(
        `Are you sure you want to delete all ${transactions.length} transaction(s) for ${customerName}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("customer_name", customerName);

      if (error) throw error;

      // Invalidate caches to refresh data
      await invalidateSalesCaches(queryClient);
      setExpandedCustomer(null);
    } catch (error) {
      console.error("Error deleting customer transactions:", error);
      alert("Failed to delete transactions. Please try again.");
    }
  };

  // Calculate customer balances from sales data
  const customerBalances = useMemo(() => {
    const balanceMap = new Map<string, CustomerBalance>();

    sales.forEach((sale) => {
      // Only include sales with customer tracking and outstanding balances
      if (!sale.customer_name) return;

      const customerName = sale.customer_name;
      const totalSale = sale.total_sale || 0;
      const amountPaid = sale.amount_paid || 0;
      const outstanding = totalSale - amountPaid;

      // Skip if fully paid
      if (outstanding <= 0.01) return; // Allow for small rounding errors

      if (!balanceMap.has(customerName)) {
        balanceMap.set(customerName, {
          customer_name: customerName,
          total_sales: 0,
          total_paid: 0,
          outstanding_balance: 0,
          transaction_count: 0,
          last_transaction_date: sale.created_at,
          payment_status: sale.payment_status as any,
        });
      }

      const customer = balanceMap.get(customerName)!;
      customer.total_sales += totalSale;
      customer.total_paid += amountPaid;
      customer.outstanding_balance += outstanding;
      customer.transaction_count += 1;

      // Update last transaction date
      if (
        new Date(sale.created_at) > new Date(customer.last_transaction_date)
      ) {
        customer.last_transaction_date = sale.created_at;
      }

      // Determine overall payment status
      if (customer.transaction_count > 1) {
        customer.payment_status = "mixed";
      } else {
        customer.payment_status = sale.payment_status as any;
      }
    });

    return Array.from(balanceMap.values());
  }, [sales]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customerBalances.filter((customer) =>
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    switch (sortBy) {
      case "balance":
        filtered.sort((a, b) => b.outstanding_balance - a.outstanding_balance);
        break;
      case "name":
        filtered.sort((a, b) => a.customer_name.localeCompare(b.customer_name));
        break;
      case "date":
        filtered.sort(
          (a, b) =>
            new Date(b.last_transaction_date).getTime() -
            new Date(a.last_transaction_date).getTime()
        );
        break;
    }

    return filtered;
  }, [customerBalances, searchTerm, sortBy]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalCustomers: filteredCustomers.length,
      totalOutstanding: filteredCustomers.reduce(
        (sum, c) => sum + c.outstanding_balance,
        0
      ),
      totalSales: filteredCustomers.reduce((sum, c) => sum + c.total_sales, 0),
      totalPaid: filteredCustomers.reduce((sum, c) => sum + c.total_paid, 0),
    };
  }, [filteredCustomers]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await invalidateSalesCaches(queryClient);
    } finally {
      setIsRefreshing(false);
    }
  }

  function exportToPDF() {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Outstanding Balances", 14, 20);

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    // Summary
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total Customers with Balance: ${totals.totalCustomers}`, 14, 45);
    doc.text(
      `Total Outstanding: KES ${totals.totalOutstanding.toLocaleString(
        "en-US",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )}`,
      14,
      51
    );
    doc.text(
      `Total Sales: KES ${totals.totalSales.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      14,
      57
    );
    doc.text(
      `Total Paid: KES ${totals.totalPaid.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      14,
      63
    );

    // Table
    autoTable(doc, {
      startY: 70,
      head: [
        ["Customer", "Total Sales", "Paid", "Outstanding", "Transactions"],
      ],
      body: filteredCustomers.map((customer) => [
        customer.customer_name,
        `KES ${customer.total_sales.toFixed(2)}`,
        `KES ${customer.total_paid.toFixed(2)}`,
        `KES ${customer.outstanding_balance.toFixed(2)}`,
        customer.transaction_count.toString(),
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237] }, // Purple
      styles: { fontSize: 9 },
    });

    doc.save(`customer-balances-${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function exportToCSV() {
    const headers = [
      "Customer Name",
      "Total Sales",
      "Amount Paid",
      "Outstanding Balance",
      "Transactions",
      "Last Transaction",
    ];
    const rows = filteredCustomers.map((customer) => [
      customer.customer_name,
      customer.total_sales.toFixed(2),
      customer.total_paid.toFixed(2),
      customer.outstanding_balance.toFixed(2),
      customer.transaction_count.toString(),
      new Date(customer.last_transaction_date).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-balances-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-center space-x-3">
          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
          <span className="text-slate-900 dark:text-white font-semibold">
            Loading customer balances...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500" />
            Customer Balances
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm md:text-base">
            Track outstanding payments and customer credit
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-3 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl border-2 border-amber-400 dark:border-amber-700 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw
            className={`w-5 h-5 text-amber-600 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-amber-400 dark:border-amber-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totals.totalCustomers}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
            Customers with Balance
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-red-400 dark:border-red-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            KES{" "}
            {totals.totalOutstanding.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
            Total Outstanding
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-blue-400 dark:border-blue-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            KES{" "}
            {totals.totalSales.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
            Total Sales
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-emerald-400 dark:border-emerald-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            KES{" "}
            {totals.totalPaid.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">
            Total Paid
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 transition-all"
            />
          </div>

          {/* Sort & Export */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-amber-500 dark:focus:border-amber-600 transition-all font-semibold"
            >
              <option value="balance" className="bg-white">
                Sort by Balance
              </option>
              <option value="name" className="bg-white">
                Sort by Name
              </option>
              <option value="date" className="bg-white">
                Sort by Date
              </option>
            </select>

            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400 text-white rounded-xl hover:scale-105 active:scale-95 transition-all font-bold shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 border-2 border-emerald-400 text-white rounded-xl hover:scale-105 active:scale-95 transition-all font-bold shadow-lg"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchTerm ? "No customers found" : "No outstanding balances"}
          </h3>
          <p className="text-slate-600">
            {searchTerm
              ? "Try adjusting your search term"
              : "All customers have paid in full! 🎉"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-amber-500 to-amber-600 border-b-2 border-amber-400">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-bold text-white">
                    Customer Name
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-white">
                    Total Sales
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-white">
                    Amount Paid
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-white">
                    Outstanding
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-bold text-white">
                    Transactions
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-bold text-white">
                    Last Transaction
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-bold text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <>
                    <tr
                      key={customer.customer_name}
                      className="hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setExpandedCustomer(
                                expandedCustomer === customer.customer_name
                                  ? null
                                  : customer.customer_name
                              )
                            }
                            className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
                          >
                            {expandedCustomer === customer.customer_name ? (
                              <ChevronUp className="w-5 h-5 text-amber-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold">
                            {customer.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {customer.customer_name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {customer.payment_status === "not_paid"
                                ? "Not Paid"
                                : customer.payment_status === "partial"
                                ? "Partial Payment"
                                : "Multiple Transactions"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 font-semibold">
                        KES{" "}
                        {customer.total_sales.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                        KES{" "}
                        {customer.total_paid.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-red-600">
                          KES{" "}
                          {customer.outstanding_balance.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 bg-amber-50 border-2 border-amber-400 rounded-full text-amber-700 font-bold text-sm">
                          {customer.transaction_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 text-sm">
                        {new Date(
                          customer.last_transaction_date
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleDeleteCustomer(customer.customer_name)
                          }
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors group inline-flex items-center justify-center"
                          title="Delete all transactions"
                        >
                          <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                        </button>
                      </td>
                    </tr>
                    {expandedCustomer === customer.customer_name && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-amber-50">
                          <div className="space-y-3">
                            <h4 className="font-bold text-slate-900 mb-3">
                              Transaction History
                            </h4>
                            {getCustomerTransactions(
                              customer.customer_name
                            ).map((sale, index) => (
                              <div
                                key={sale.id || index}
                                className="bg-white rounded-xl p-4 border-2 border-slate-200"
                              >
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-slate-500">
                                      Date:
                                    </span>
                                    <p className="font-semibold text-slate-900">
                                      {new Date(
                                        sale.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Total Sale:
                                    </span>
                                    <p className="font-semibold text-slate-900">
                                      KES {sale.total_sale?.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Amount Paid:
                                    </span>
                                    <p className="font-semibold text-emerald-600">
                                      KES{" "}
                                      {(sale.amount_paid || 0).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">
                                      Outstanding:
                                    </span>
                                    <p className="font-semibold text-red-600">
                                      KES{" "}
                                      {(
                                        (sale.total_sale || 0) -
                                        (sale.amount_paid || 0)
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.customer_name} className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setExpandedCustomer(
                        expandedCustomer === customer.customer_name
                          ? null
                          : customer.customer_name
                      )
                    }
                    className="p-1 hover:bg-amber-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    {expandedCustomer === customer.customer_name ? (
                      <ChevronUp className="w-5 h-5 text-amber-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                    {customer.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 text-lg">
                      {customer.customer_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {customer.transaction_count} transaction(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500 mb-1">
                      Outstanding
                    </div>
                    <div className="font-bold text-red-600">
                      KES{" "}
                      {customer.outstanding_balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Total Sales
                    </div>
                    <div className="font-semibold text-slate-900">
                      KES{" "}
                      {customer.total_sales.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      Amount Paid
                    </div>
                    <div className="font-semibold text-emerald-600">
                      KES{" "}
                      {customer.total_paid.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-slate-500 mb-1">
                      Last Transaction
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(
                        customer.last_transaction_date
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleDeleteCustomer(customer.customer_name)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group flex items-center gap-2"
                    title="Delete all transactions"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-600">
                      Delete All
                    </span>
                  </button>
                </div>

                {expandedCustomer === customer.customer_name && (
                  <div className="pt-4 border-t border-slate-300 space-y-3">
                    <h4 className="font-bold text-slate-900 mb-2">
                      Transaction History
                    </h4>
                    {getCustomerTransactions(customer.customer_name).map(
                      (sale, index) => (
                        <div
                          key={sale.id || index}
                          className="bg-white rounded-xl p-4 border-2 border-slate-200 space-y-2"
                        >
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">
                              Date:
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">
                              Total Sale:
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              KES {sale.total_sale?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">
                              Amount Paid:
                            </span>
                            <span className="text-sm font-semibold text-emerald-600">
                              KES {(sale.amount_paid || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-slate-500">
                              Outstanding:
                            </span>
                            <span className="text-sm font-semibold text-red-600">
                              KES{" "}
                              {(
                                (sale.total_sale || 0) - (sale.amount_paid || 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
