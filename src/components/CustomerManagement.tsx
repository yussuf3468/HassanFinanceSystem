import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { InternalCustomer, CustomerPayment } from "../types";
import { toast } from "react-toastify";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<InternalCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<InternalCustomer | null>(null);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);

  const [formData, setFormData] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    notes: "",
  });

  const staffName = localStorage.getItem("staff_name") || "Staff";

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers((data as unknown as InternalCustomer[]) || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  async function loadPayments(customerId: string) {
    try {
      const { data, error } = await supabase
        .from("customer_payments" as any)
        .select("*")
        .eq("customer_id", customerId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments((data as unknown as CustomerPayment[]) || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  }

  function openAddModal() {
    setSelectedCustomer(null);
    setFormData({
      customer_name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    });
    setShowModal(true);
  }

  function openEditModal(customer: InternalCustomer) {
    setSelectedCustomer(customer);
    setFormData({
      customer_name: customer.customer_name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({
            customer_name: formData.customer_name,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            address: formData.address || undefined,
            notes: formData.notes || undefined,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", selectedCustomer.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        // Create new customer
        const { error } = await supabase.from("customers").insert({
          customer_name: formData.customer_name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          notes: formData.notes || null,
          credit_balance: 0,
          total_purchases: 0,
          total_payments: 0,
          is_active: true,
        } as any);

        if (error) throw error;
        toast.success("Customer added successfully");
      }

      setShowModal(false);
      loadCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Failed to save customer");
    }
  }

  async function handleDelete(customer: InternalCustomer) {
    if (customer.id === "00000000-0000-0000-0000-000000000001") {
      toast.error("Cannot delete walk-in customer");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${customer.customer_name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      if (error) throw error;
      toast.success("Customer deleted successfully");
      loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  }

  function openPaymentModal(customer: InternalCustomer) {
    setSelectedCustomer(customer);
    setPaymentData({
      amount: "",
      payment_method: "cash",
      notes: "",
    });
    loadPayments(customer.id);
    setShowPaymentModal(true);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCustomer) return;

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > selectedCustomer.credit_balance) {
      toast.error("Payment amount cannot exceed credit balance");
      return;
    }

    try {
      const { error } = await supabase.from("customer_payments" as any).insert({
        customer_id: selectedCustomer.id,
        amount: amount,
        payment_method: paymentData.payment_method,
        payment_date: new Date().toISOString(),
        notes: paymentData.notes || null,
        processed_by: staffName,
      } as any);

      if (error) throw error;

      toast.success(
        `Payment of KES ${amount.toLocaleString()} received from ${
          selectedCustomer.customer_name
        }`
      );
      setPaymentData({ amount: "", payment_method: "cash", notes: "" });
      loadCustomers();
      loadPayments(selectedCustomer.id);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.id !== "00000000-0000-0000-0000-000000000001" && // Exclude walk-in customer
      (c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const totalCreditBalance = customers.reduce(
    (sum, c) => sum + c.credit_balance,
    0
  );
  const customersWithBalance = customers.filter(
    (c) => c.credit_balance > 0
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-400" />
            <span>Customer Management</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Manage customer accounts and credit balances
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{customers.length}</p>
          <p className="text-sm text-slate-400">Total Customers</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {customersWithBalance}
          </p>
          <p className="text-sm text-slate-400">With Balance</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            KES {totalCreditBalance.toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Total Credit</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            KES{" "}
            {customers
              .reduce((sum, c) => sum + c.total_purchases, 0)
              .toLocaleString()}
          </p>
          <p className="text-sm text-slate-400">Total Sales</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customers by name, phone, or email..."
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Credit Balance
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Purchases
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-white">
                        {customer.customer_name}
                      </p>
                      {customer.address && (
                        <p className="text-sm text-slate-400 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{customer.address}</span>
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {customer.phone && (
                        <p className="text-sm text-slate-300 flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-slate-400 flex items-center space-x-1">
                          <Mail className="w-3 h-3" />
                          <span>{customer.email}</span>
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`font-bold ${
                        customer.credit_balance > 0
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      KES {customer.credit_balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    KES {customer.total_purchases.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {customer.is_active ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      {customer.credit_balance > 0 && (
                        <button
                          onClick={() => openPaymentModal(customer)}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                          title="Receive Payment"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {customer.id !==
                        "00000000-0000-0000-0000-000000000001" && (
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white">
                {selectedCustomer ? "Edit Customer" : "Add New Customer"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+254 700 000 000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="customer@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Customer address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Additional notes about the customer"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                >
                  {selectedCustomer ? "Update Customer" : "Add Customer"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Receive Payment
                </h2>
                <p className="text-slate-400 mt-1">
                  From: {selectedCustomer.customer_name}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Balance */}
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Current Balance</p>
                    <p className="text-3xl font-bold text-red-400">
                      KES {selectedCustomer.credit_balance.toLocaleString()}
                    </p>
                  </div>
                  <CreditCard className="w-12 h-12 text-red-400" />
                </div>
              </div>

              {/* Payment Form */}
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Amount (KES) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCustomer.credit_balance}
                    required
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        payment_method: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Payment reference or notes"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium flex items-center justify-center space-x-2"
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Process Payment</span>
                </button>
              </form>

              {/* Payment History */}
              {payments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-3">
                    Payment History
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-white">
                            KES {payment.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(
                              payment.payment_date
                            ).toLocaleDateString()}{" "}
                            • {payment.payment_method} • {payment.processed_by}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
