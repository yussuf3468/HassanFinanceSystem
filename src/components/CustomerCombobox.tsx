import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, User } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CustomerCombobox — a searchable replacement for the POS customer
   <select>. As the credit-customer list grows, staff can type a
   name or phone instead of scrolling. Opens upward so it never
   collides with the checkout footer, with full keyboard support.
   ═══════════════════════════════════════════════════════════════ */

export interface SavedCustomer {
  name: string;
  phone: string;
}

interface Row {
  phone: string; // "" = Walk-in
  name: string;
  walkIn?: boolean;
}

interface CustomerComboboxProps {
  customers: SavedCustomer[];
  /** Selected phone; "" means Walk-in Customer. */
  selectedPhone: string;
  selectedName: string;
  /** Called with a phone, or "" to reset to Walk-in. */
  onSelect: (phone: string) => void;
}

export default function CustomerCombobox({
  customers,
  selectedPhone,
  selectedName,
  onSelect,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isWalkIn = selectedPhone.trim() === "";

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone || "").toLowerCase().includes(q),
        )
      : customers;
    const showWalkIn = !q || "walk-in customer".includes(q);
    return [
      ...(showWalkIn ? [{ phone: "", name: "Walk-in Customer", walkIn: true }] : []),
      ...matches.map((c) => ({ phone: c.phone, name: c.name })),
    ];
  }, [customers, query]);

  // Reset state each time the menu opens; focus the search field.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row in view.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-row="${highlight}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function choose(phone: string) {
    onSelect(phone);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlight];
      if (row) choose(row.phone);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-sm text-slate-900 outline-none transition-colors focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">
            {isWalkIn ? (
              "Walk-in Customer"
            ) : (
              <>
                {selectedName || "Customer"}
                <span className="text-slate-400"> — {selectedPhone}</span>
              </>
            )}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Menu (opens upward) */}
      {open && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-800">
          <div className="border-b border-slate-100 p-1.5 dark:border-slate-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search name or phone…"
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
            {rows.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                No customers match “{query.trim()}”.
              </p>
            ) : (
              rows.map((row, i) => {
                const active = i === highlight;
                const selected = row.phone === selectedPhone;
                return (
                  <button
                    key={row.phone || "walk-in"}
                    type="button"
                    data-row={i}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(row.phone)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors ${
                      active
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm ${
                          row.walkIn
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {row.name}
                      </span>
                      {!row.walkIn && (
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {row.phone}
                        </span>
                      )}
                    </span>
                    {selected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
