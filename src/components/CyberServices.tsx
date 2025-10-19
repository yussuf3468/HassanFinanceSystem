import { useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Monitor,
  Calendar,
  DollarSign,
  TrendingUp,
  Printer,
  FileEdit,
  Wifi,
  Download,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import ModalPortal from "./ModalPortal";
import { formatDate, getCurrentDateForInput } from "../utils/dateFormatter";

interface CyberService {
  id: string;
  service_name: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

interface ServiceForm {
  service_name: string;
  amount: number;
  date: string;
  notes: string;
}

const SERVICE_OPTIONS = [
  "Photocopy",
  "Printing",
  "Scanning",
  "Editing",
  "Typing",
  "Internet Service",
  "Lamination",
  "Binding",
  "CV Writing",
  "Document Formatting",
  "Email Service",
  "Computer Training",
  "Other",
];

export default function CyberServices() {
  const [services, setServices] = useState<CyberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<CyberService | null>(
    null
  );
  const [formData, setFormData] = useState<ServiceForm>({
    service_name: "Photocopy",
    amount: 0,
    date: getCurrentDateForInput(),
    notes: "",
  });

  // Stats
  const totalIncome = services.reduce(
    (sum, service) => sum + service.amount,
    0
  );
  const todayIncome = services
    .filter((service) => {
      const serviceDate = new Date(service.date).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      return serviceDate === today;
    })
    .reduce((sum, service) => sum + service.amount, 0);

  const thisMonthIncome = services
    .filter((service) => {
      const serviceDate = new Date(service.date);
      const now = new Date();
      return (
        serviceDate.getMonth() === now.getMonth() &&
        serviceDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, service) => sum + service.amount, 0);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("cyber_services" as any)
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      setServices((data as unknown as CyberService[]) || []);
    } catch (error) {
      console.error("Error loading cyber services:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from("cyber_services" as any)
          .update({
            service_name: formData.service_name,
            amount: formData.amount,
            date: formData.date,
            notes: formData.notes,
          })
          .eq("id", editingService.id);

        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase.from("cyber_services" as any).insert([
          {
            service_name: formData.service_name,
            amount: formData.amount,
            date: formData.date,
            notes: formData.notes,
          },
        ]);

        if (error) throw error;
      }

      await loadServices();
      closeForm();
    } catch (error) {
      console.error("Error saving cyber service:", error);
      alert("Failed to save cyber service. Please try again.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this service entry?")) return;

    try {
      const { error } = await supabase
        .from("cyber_services" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadServices();
    } catch (error) {
      console.error("Error deleting cyber service:", error);
      alert("Failed to delete cyber service. Please try again.");
    }
  }

  function openEditForm(service: CyberService) {
    setEditingService(service);
    setFormData({
      service_name: service.service_name,
      amount: service.amount,
      date: service.date,
      notes: service.notes || "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
    resetForm();
  }

  function resetForm() {
    setFormData({
      service_name: "Photocopy",
      amount: 0,
      date: getCurrentDateForInput(),
      notes: "",
    });
  }

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("photo") || name.includes("print")) return Printer;
    if (name.includes("edit") || name.includes("format")) return FileEdit;
    if (name.includes("internet") || name.includes("wifi")) return Wifi;
    if (name.includes("download") || name.includes("scan")) return Download;
    return Monitor;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading cyber services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 md:p-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-blue-200 mb-1">
                💻 Cyber Services
              </h1>
              <p className="text-xs md:text-sm text-slate-200 font-medium">
                Track income from cyber café services - All entries are pure
                profit
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-4 border border-green-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-500/20 p-2.5 rounded-xl border border-green-500/30">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
              All Time
            </span>
          </div>
          <p className="text-xs text-green-300 mb-1">Total Income</p>
          <p className="text-2xl md:text-3xl font-black text-white">
            KES {totalIncome.toLocaleString()}
          </p>
        </div>

        {/* Today's Income */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-cyan-500/20 p-2.5 rounded-xl border border-cyan-500/30">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
              Today
            </span>
          </div>
          <p className="text-sm text-cyan-300 mb-1">Today's Income</p>
          <p className="text-2xl md:text-3xl font-black text-white">
            KES {todayIncome.toLocaleString()}
          </p>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500/20 p-3 rounded-xl border border-purple-500/30">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
              This Month
            </span>
          </div>
          <p className="text-sm text-purple-300 mb-1">Monthly Income</p>
          <p className="text-2xl md:text-3xl font-black text-white">
            KES {thisMonthIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/20">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
            <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            <span>Service Records</span>
            <span className="text-sm font-normal text-slate-400">
              ({services.length} entries)
            </span>
          </h2>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {services.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <Monitor className="w-12 h-12 mx-auto mb-3 text-slate-500" />
                    <p className="text-lg font-semibold">
                      No services recorded yet
                    </p>
                    <p className="text-sm mt-1">
                      Add your first cyber service entry to get started
                    </p>
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const ServiceIcon = getServiceIcon(service.service_name);
                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatDate(service.date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
                            <ServiceIcon className="w-4 h-4 text-cyan-400" />
                          </div>
                          <span className="font-semibold text-white">
                            {service.service_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-green-400">
                          KES {service.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {service.notes || "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditForm(service)}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg border border-blue-500/30 transition-all duration-200 hover:scale-110"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg border border-red-500/30 transition-all duration-200 hover:scale-110"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4">
          {services.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Monitor className="w-12 h-12 mx-auto mb-3 text-slate-500" />
              <p className="text-lg font-semibold">No services recorded yet</p>
              <p className="text-sm mt-1">
                Add your first cyber service entry to get started
              </p>
            </div>
          ) : (
            services.map((service) => {
              const ServiceIcon = getServiceIcon(service.service_name);
              return (
                <div
                  key={service.id}
                  className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-cyan-500/20 p-2 rounded-lg border border-cyan-500/30">
                        <ServiceIcon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {service.service_name}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {formatDate(service.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-green-400">
                        KES {service.amount.toLocaleString()}
                      </p>
                      {service.notes && (
                        <p className="text-xs text-slate-400 mt-1">
                          {service.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditForm(service)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg border border-blue-500/30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg border border-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full border border-white/20 shadow-2xl animate-fadeIn">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-6">
                {editingService ? "Edit Service" : "Add New Service"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Service Name Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Service Type
                  </label>
                  <select
                    value={formData.service_name}
                    onChange={(e) =>
                      setFormData({ ...formData, service_name: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="bg-slate-800 text-white"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Additional details..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg border border-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    {editingService ? "Update" : "Add Service"}
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
