import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Monitor,
  Printer,
  FileEdit,
  Wifi,
  Download,
  Search,
  Zap,
  Settings2,
  Check,
  X,
  Calendar,
} from "lucide-react";
import {
  getCyberServices,
  createCyberService,
  updateCyberService,
  deleteCyberService,
} from "../api/cyberServicesApi";
import ModalPortal from "./ModalPortal";
import ConfirmDialog from "./ui/ConfirmDialog";
import compactToast from "../utils/compactToast";
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

interface Preset {
  id: string;
  label: string;
  price: number;
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

// Sensible starting tiles for a Kenyan cyber café — staff can retune the
// prices/labels via "Customize", and they persist per device.
const DEFAULT_PRESETS: Preset[] = [
  { id: "p1", label: "Photocopy", price: 5 },
  { id: "p2", label: "Print B&W", price: 10 },
  { id: "p3", label: "Print Color", price: 20 },
  { id: "p4", label: "Scanning", price: 20 },
  { id: "p5", label: "Lamination", price: 50 },
  { id: "p6", label: "Binding", price: 50 },
  { id: "p7", label: "Typing", price: 50 },
  { id: "p8", label: "Internet Service", price: 20 },
];

const AMOUNT_CHIPS = [5, 10, 20, 50, 100, 200];
const PRESETS_KEY = "cyber.presets.v1";

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_PRESETS;
}

const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes("photo") || name.includes("print") || name.includes("copy"))
    return Printer;
  if (name.includes("edit") || name.includes("format") || name.includes("typ"))
    return FileEdit;
  if (name.includes("internet") || name.includes("wifi")) return Wifi;
  if (name.includes("download") || name.includes("scan")) return Download;
  return Monitor;
};

const money = (value: number) => `KES ${Math.round(value).toLocaleString()}`;

export default function CyberServices() {
  const [services, setServices] = useState<CyberService[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick-record bar
  const [quickService, setQuickService] = useState(SERVICE_OPTIONS[0]);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickDate, setQuickDate] = useState(getCurrentDateForInput());
  const amountRef = useRef<HTMLInputElement>(null);

  // Presets
  const [presets, setPresets] = useState<Preset[]>(loadPresets);
  const [customizing, setCustomizing] = useState(false);

  // List controls
  const [periodFilter, setPeriodFilter] = useState<"today" | "month" | "all">(
    "today",
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<CyberService | null>(null);
  const [formData, setFormData] = useState<ServiceForm>({
    service_name: "Photocopy",
    amount: 0,
    date: getCurrentDateForInput(),
    notes: "",
  });
  const [pendingDelete, setPendingDelete] = useState<CyberService | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  async function loadServices() {
    try {
      setLoading(true);
      const data = await getCyberServices();
      setServices((data as unknown as CyberService[]) || []);
    } catch (error) {
      console.error("Error loading cyber services:", error);
    } finally {
      setLoading(false);
    }
  }

  const todayStr = getCurrentDateForInput();

  // ── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    let all = 0;
    let today = 0;
    let month = 0;
    let todayCount = 0;
    for (const s of services) {
      all += s.amount;
      const ds = String(s.date).slice(0, 10);
      if (ds === todayStr) {
        today += s.amount;
        todayCount += 1;
      }
      const d = new Date(s.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
        month += s.amount;
    }
    return { all, today, month, todayCount };
  }, [services, todayStr]);

  // ── Optimistic record (used by tiles + quick bar) ──────────
  async function recordService(name: string, amount: number, date = quickDate) {
    if (!amount || amount <= 0) {
      compactToast.error("Enter an amount first");
      amountRef.current?.focus();
      return;
    }
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: CyberService = {
      id: tempId,
      service_name: name,
      amount,
      date,
      notes: "",
      created_at: new Date().toISOString(),
    };
    setServices((prev) => [optimistic, ...prev]);
    try {
      const created = await createCyberService({
        service_name: name,
        amount,
        date,
        notes: "",
      });
      if (created) {
        setServices((prev) =>
          prev.map((s) => (s.id === tempId ? (created as unknown as CyberService) : s)),
        );
      }
      compactToast.success(`${name} · ${money(amount)}`);
    } catch (error) {
      console.error("Error recording service:", error);
      setServices((prev) => prev.filter((s) => s.id !== tempId));
      compactToast.error("Failed to record. Please try again.");
    }
  }

  function handleQuickRecord() {
    const amt = parseFloat(quickAmount);
    recordService(quickService, amt);
    setQuickAmount("");
    // Keep the shift moving — stay ready for the next entry.
    setTimeout(() => amountRef.current?.focus(), 10);
  }

  // ── Edit modal ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingService) {
        await updateCyberService(editingService.id, {
          service_name: formData.service_name,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes,
        });
        compactToast.success("Entry updated");
      } else {
        await createCyberService({
          service_name: formData.service_name,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes,
        });
        compactToast.success("Entry added");
      }
      await loadServices();
      closeForm();
    } catch (error) {
      console.error("Error saving cyber service:", error);
      compactToast.error("Failed to save. Please try again.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const id = pendingDelete.id;
    // Optimistic removal.
    const snapshot = services;
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteCyberService(id);
      compactToast.success("Entry deleted");
    } catch (error) {
      console.error("Error deleting cyber service:", error);
      setServices(snapshot);
      compactToast.error("Failed to delete");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
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

  function openAddForm() {
    setEditingService(null);
    setFormData({
      service_name: quickService,
      amount: 0,
      date: quickDate,
      notes: "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
  }

  // ── Preset editing ─────────────────────────────────────────
  function updatePreset(id: string, patch: Partial<Preset>) {
    setPresets((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }
  function addPreset() {
    setPresets((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, label: "New service", price: 10 },
    ]);
  }
  function resetPresets() {
    setPresets(DEFAULT_PRESETS);
  }

  // ── Filtered list ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    const q = searchTerm.trim().toLowerCase();
    return services
      .filter((s) => {
        const ds = String(s.date).slice(0, 10);
        if (periodFilter === "today" && ds !== todayStr) return false;
        if (periodFilter === "month") {
          const d = new Date(s.date);
          if (
            d.getMonth() !== now.getMonth() ||
            d.getFullYear() !== now.getFullYear()
          )
            return false;
        }
        if (
          q &&
          !s.service_name.toLowerCase().includes(q) &&
          !(s.notes || "").toLowerCase().includes(q)
        )
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date).getTime() -
          new Date(a.created_at || a.date).getTime(),
      );
  }, [services, periodFilter, searchTerm, todayStr]);

  const filteredTotal = filtered.reduce((sum, s) => sum + s.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Loading cyber services…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header (compact summary, no big stat cards) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Cyber Services
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Today{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {money(stats.today)}
            </span>{" "}
            · {stats.todayCount} {stats.todayCount === 1 ? "entry" : "entries"} ·
            month{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              {money(stats.month)}
            </span>{" "}
            · all-time{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
              {money(stats.all)}
            </span>
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
          Detailed entry
        </button>
      </div>

      {/* ── Quick record ── */}
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-800 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick record
          </h2>
          <button
            onClick={() => setCustomizing((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
              customizing
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200"
            }`}
          >
            {customizing ? <Check className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
            {customizing ? "Done" : "Customize"}
          </button>
        </div>

        {/* Preset tiles */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {presets.map((preset) => {
            const Icon = getServiceIcon(preset.label);
            if (customizing) {
              return (
                <div
                  key={preset.id}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-700"
                >
                  <input
                    value={preset.label}
                    onChange={(e) => updatePreset(preset.id, { label: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-900 outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="number"
                    value={preset.price}
                    onChange={(e) =>
                      updatePreset(preset.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-14 rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={() => removePreset(preset.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={preset.id}
                onClick={() => recordService(preset.label, preset.price)}
                className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md active:translate-y-0 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-amber-700"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                    {preset.label}
                  </span>
                  <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {money(preset.price)}
                  </span>
                </span>
              </button>
            );
          })}
          {customizing && (
            <button
              onClick={addPreset}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-3 text-xs font-semibold text-slate-500 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-400"
            >
              <Plus className="h-4 w-4" />
              Add tile
            </button>
          )}
        </div>

        {customizing ? (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tiles save automatically on this device.
            </p>
            <button
              onClick={resetPresets}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Reset to defaults
            </button>
          </div>
        ) : (
          <>
            {/* Manual quick bar */}
            <div className="mt-3 flex flex-col gap-2 border-t border-amber-200/60 pt-3 dark:border-amber-900/30 sm:flex-row sm:items-center">
              <select
                value={quickService}
                onChange={(e) => setQuickService(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white sm:w-44"
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  KES
                </span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleQuickRecord();
                    }
                  }}
                  placeholder="Amount"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleQuickRecord}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Record
              </button>
            </div>
            {/* Amount chips + date */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {AMOUNT_CHIPS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setQuickAmount(String(amt))}
                  className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  {amt}
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                />
              </label>
            </div>
          </>
        )}
      </div>

      {/* ── Entries ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-800">
        {/* Controls */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-900">
            {(
              [
                { key: "today", label: "Today" },
                { key: "month", label: "This month" },
                { key: "all", label: "All" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPeriodFilter(tab.key)}
                className={`h-9 rounded-full px-4 text-xs font-semibold transition sm:text-[13px] ${
                  periodFilter === tab.key
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search…"
                className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {filtered.length} shown
              </p>
              <p className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                {money(filteredTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Empty */}
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <Monitor className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {searchTerm
                ? "No entries match your search"
                : periodFilter === "today"
                  ? "No entries yet today"
                  : "No entries in this period"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Tap a tile above or use quick record to log a service in seconds.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40">
                    {["Time", "Service", "Amount", "Notes", ""].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
                  {filtered.map((service) => {
                    const Icon = getServiceIcon(service.service_name);
                    return (
                      <tr
                        key={service.id}
                        className="group transition-colors hover:bg-amber-50/40 dark:hover:bg-slate-700/40"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-sm text-slate-600 dark:text-slate-300">
                          {formatDate(service.date)}
                          {service.created_at && (
                            <span className="ml-1.5 text-xs text-slate-400">
                              {new Date(service.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {service.service_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {money(service.amount)}
                        </td>
                        <td className="max-w-[240px] truncate px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                          {service.notes || "—"}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => openEditForm(service)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPendingDelete(service)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-2.5 p-3 md:hidden">
              {filtered.map((service) => {
                const Icon = getServiceIcon(service.service_name);
                return (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-700"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {service.service_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(service.date)}
                        {service.notes ? ` · ${service.notes}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                      {money(service.amount)}
                    </p>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() => openEditForm(service)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(service)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Edit / detailed-add modal ── */}
      {showForm && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingService ? "Edit entry" : "Detailed entry"}
                </h3>
                <button
                  onClick={closeForm}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Service type
                  </label>
                  <select
                    value={formData.service_name}
                    onChange={(e) =>
                      setFormData({ ...formData, service_name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Notes (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    rows={2}
                    placeholder="e.g. customer name, page count…"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="h-11 flex-1 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-11 flex-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:-translate-y-0.5"
                  >
                    {editingService ? "Update" : "Add entry"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this entry?"
        lines={[
          pendingDelete
            ? `${pendingDelete.service_name} · ${money(pendingDelete.amount)} on ${formatDate(pendingDelete.date)} will be removed.`
            : "",
          "This cannot be undone.",
        ]}
        confirmLabel={deleting ? "Deleting…" : "Delete entry"}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}
