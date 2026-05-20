import { useRef, useState } from "react";
import {
  X,
  Printer,
  FileText,
  Share2,
  Plus,
  Check,
  Copy,
  Smartphone,
} from "lucide-react";

export type DiscountType = "none" | "percentage" | "amount";

export interface ReceiptItem {
  product_name: string;
  product_id?: string;
  quantity: number;
  unit_price: number;
  original_total: number;
  discount_amount: number;
  final_unit_price: number;
  line_total: number;
  profit: number;
}

export interface ReceiptData {
  transactionId: string;
  sold_by: string;
  payment_method: string;
  customer_name: string;
  payment_status: string;
  amount_paid: number;
  created_at: Date;
  items: ReceiptItem[];
  subtotal: number;
  total_line_discount: number;
  overall_discount_type: DiscountType;
  overall_discount_value: number;
  overall_discount_amount: number;
  total: number;
  total_profit: number;
  balance_due: number;
}

interface POSReceiptProps {
  receipt: ReceiptData;
  onNewSale: () => void;
  onClose: () => void;
}

const BUSINESS = {
  name: "Hassan Bookshop",
  tagline: "Quality Educational Materials & Supplies",
  tel: "+254 722 979 547",
  email: "yussufh080@gmail.com",
  location: "Eastleigh, Nairobi",
};

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: Date) {
  return d.toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortTxn(id: string) {
  return id.slice(0, 8).toUpperCase();
}

/** Build the printable HTML. format: "a4" | "thermal" */
function buildPrintableHtml(r: ReceiptData, format: "a4" | "thermal"): string {
  const isThermal = format === "thermal";
  const totalDiscount = r.total_line_discount + r.overall_discount_amount;
  const itemsRows = r.items
    .map((it) => {
      if (isThermal) {
        return `
          <div class="row">
            <div class="row-top">
              <span class="name">${escapeHtml(it.product_name)}</span>
            </div>
            <div class="row-bottom">
              <span>${it.quantity} × ${it.unit_price.toLocaleString()}${
                it.discount_amount > 0
                  ? ` <span class="disc">-${it.discount_amount.toLocaleString()}</span>`
                  : ""
              }</span>
              <span class="amt">${it.line_total.toLocaleString()}</span>
            </div>
          </div>`;
      }
      return `
        <tr>
          <td>${escapeHtml(it.product_name)}</td>
          <td class="num">${it.quantity}</td>
          <td class="num">${it.unit_price.toLocaleString()}</td>
          <td class="num">${
            it.discount_amount > 0
              ? "-" + it.discount_amount.toLocaleString()
              : "—"
          }</td>
          <td class="num">${it.line_total.toLocaleString()}</td>
        </tr>`;
    })
    .join("");

  const css = isThermal
    ? `
      @page { size: 80mm auto; margin: 0; }
      html, body { margin: 0; padding: 0; }
      body {
        width: 80mm;
        font-family: 'Consolas', 'Menlo', 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.35;
        color: #000;
        padding: 4mm 3mm;
      }
      .h { text-align: center; }
      .h h1 { font-size: 16px; margin: 0; letter-spacing: 1px; }
      .h .sub { font-size: 10px; margin-top: 1px; }
      .meta { margin-top: 6px; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; }
      .meta div { display: flex; justify-content: space-between; gap: 6px; }
      .items { margin-top: 4px; }
      .row { padding: 3px 0; border-bottom: 1px dotted #999; }
      .row-top { font-weight: bold; }
      .row-bottom { display: flex; justify-content: space-between; font-size: 10px; }
      .disc { color: #555; }
      .amt { font-weight: bold; }
      .totals { margin-top: 6px; border-top: 1px dashed #000; padding-top: 4px; }
      .totals div { display: flex; justify-content: space-between; }
      .grand { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #000; font-size: 14px; font-weight: bold; }
      .foot { text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #000; font-size: 10px; }
    `
    : `
      @page { size: A4; margin: 14mm; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
        color: #111;
        font-size: 12px;
        line-height: 1.45;
      }
      .header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #111; }
      .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; }
      .header .sub { color: #555; font-size: 11px; margin-top: 2px; }
      .header .label { display: inline-block; margin-top: 8px; padding: 3px 12px; background: #111; color: #fff; font-size: 11px; font-weight: bold; letter-spacing: 1px; border-radius: 999px; }
      .meta { margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 12px; }
      .meta b { color: #111; }
      table.items { width: 100%; border-collapse: collapse; margin-top: 14px; }
      table.items th, table.items td { padding: 7px 8px; border-bottom: 1px solid #ddd; }
      table.items th { background: #f5f5f5; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
      .num { text-align: right; }
      table.items tbody tr:nth-child(even) td { background: #fafafa; }
      .totals { margin-top: 12px; width: 320px; margin-left: auto; }
      .totals .line { display: flex; justify-content: space-between; padding: 4px 0; }
      .totals .grand { border-top: 2px solid #111; margin-top: 6px; padding-top: 8px; font-size: 18px; font-weight: 900; }
      .pay { margin-top: 18px; padding: 10px 12px; background: #f5f5f5; border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; font-size: 12px; }
      .pay b { color: #111; }
      .foot { margin-top: 22px; text-align: center; color: #555; font-size: 11px; border-top: 1px dashed #999; padding-top: 10px; }
      .sig { margin-top: 28px; display: flex; justify-content: space-between; gap: 32px; }
      .sig .box { flex: 1; border-top: 1px solid #111; padding-top: 4px; text-align: center; font-size: 11px; color: #555; }
    `;

  const body = isThermal
    ? `
      <div class="h">
        <h1>${BUSINESS.name}</h1>
        <div class="sub">${BUSINESS.tagline}</div>
        <div class="sub">Tel: ${BUSINESS.tel}</div>
        <div class="sub">${BUSINESS.location}</div>
      </div>
      <div class="meta">
        <div><span>Receipt #</span><span>${shortTxn(r.transactionId)}</span></div>
        <div><span>Date</span><span>${formatDate(r.created_at)}</span></div>
        <div><span>Cashier</span><span>${escapeHtml(r.sold_by)}</span></div>
        <div><span>Payment</span><span>${escapeHtml(r.payment_method)}</span></div>
        ${
          r.customer_name && r.customer_name !== "Walk-in Customer"
            ? `<div><span>Customer</span><span>${escapeHtml(r.customer_name)}</span></div>`
            : ""
        }
      </div>
      <div class="items">${itemsRows}</div>
      <div class="totals">
        <div><span>Subtotal</span><span>KES ${r.subtotal.toLocaleString()}</span></div>
        ${
          totalDiscount > 0
            ? `<div><span>Discount</span><span>-KES ${totalDiscount.toLocaleString()}</span></div>`
            : ""
        }
        <div class="grand"><span>TOTAL</span><span>KES ${r.total.toLocaleString()}</span></div>
        ${
          r.payment_status !== "paid"
            ? `<div style="margin-top:4px"><span>Paid</span><span>KES ${r.amount_paid.toLocaleString()}</span></div>
               <div><span>Balance</span><span>KES ${r.balance_due.toLocaleString()}</span></div>`
            : ""
        }
      </div>
      <div class="foot">
        ${r.payment_status === "paid" ? "** PAID **" : r.payment_status === "partial" ? "** PARTIAL **" : "** UNPAID **"}<br>
        Thank you for shopping with us!<br>
        ${BUSINESS.email}
      </div>
    `
    : `
      <div class="header">
        <h1>${BUSINESS.name}</h1>
        <div class="sub">${BUSINESS.tagline}</div>
        <div class="sub">Tel: ${BUSINESS.tel} &nbsp;·&nbsp; Email: ${BUSINESS.email}</div>
        <div class="sub">${BUSINESS.location}</div>
        <div class="label">SALES RECEIPT</div>
      </div>
      <div class="meta">
        <div><b>Receipt #:</b> ${shortTxn(r.transactionId)}</div>
        <div><b>Date:</b> ${formatDate(r.created_at)}</div>
        <div><b>Cashier:</b> ${escapeHtml(r.sold_by)}</div>
        <div><b>Payment Method:</b> ${escapeHtml(r.payment_method)}</div>
        <div><b>Customer:</b> ${escapeHtml(r.customer_name)}</div>
        <div><b>Status:</b> ${escapeHtml(r.payment_status.replace("_", " ").toUpperCase())}</div>
      </div>
      <table class="items">
        <thead>
          <tr>
            <th>Product</th>
            <th class="num">Qty</th>
            <th class="num">Unit</th>
            <th class="num">Discount</th>
            <th class="num">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="totals">
        <div class="line"><span>Subtotal</span><span>KES ${r.subtotal.toLocaleString()}</span></div>
        ${
          totalDiscount > 0
            ? `<div class="line"><span>Discount</span><span>-KES ${totalDiscount.toLocaleString()}</span></div>`
            : ""
        }
        <div class="line grand"><span>TOTAL</span><span>KES ${r.total.toLocaleString()}</span></div>
        ${
          r.payment_status !== "paid"
            ? `<div class="line"><span>Amount paid</span><span>KES ${r.amount_paid.toLocaleString()}</span></div>
               <div class="line"><span><b>Balance due</b></span><span><b>KES ${r.balance_due.toLocaleString()}</b></span></div>`
            : ""
        }
      </div>
      <div class="sig">
        <div class="box">Customer Signature</div>
        <div class="box">Staff Signature</div>
      </div>
      <div class="foot">
        Thank you for shopping with ${BUSINESS.name}. Please keep this receipt for your records.
      </div>
    `;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Receipt ${shortTxn(r.transactionId)}</title><style>${css}</style></head>
<body>${body}</body></html>`;
}

function printInIframe(html: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // already removed
    }
  };

  const fire = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      win.focus();
      win.print();
    } catch (err) {
      console.error("Print failed:", err);
    } finally {
      setTimeout(cleanup, 800);
    }
  };

  let fired = false;
  const fireOnce = () => {
    if (fired) return;
    fired = true;
    fire();
  };
  iframe.onload = fireOnce;
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    cleanup();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(fireOnce, 350);
}

async function downloadPdf(r: ReceiptData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(BUSINESS.name, pageW / 2, 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(BUSINESS.tagline, pageW / 2, 24, { align: "center" });
  doc.text(`Tel: ${BUSINESS.tel}  ·  ${BUSINESS.email}`, pageW / 2, 28.5, {
    align: "center",
  });
  doc.text(BUSINESS.location, pageW / 2, 33, { align: "center" });
  doc.setDrawColor(20);
  doc.setLineWidth(0.4);
  doc.line(14, 36, pageW - 14, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SALES RECEIPT", pageW / 2, 42, { align: "center" });

  // Meta block
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const metaY = 50;
  const colL = 14;
  const colR = pageW / 2 + 6;
  doc.text(`Receipt #: ${shortTxn(r.transactionId)}`, colL, metaY);
  doc.text(`Date: ${formatDate(r.created_at)}`, colR, metaY);
  doc.text(`Cashier: ${r.sold_by}`, colL, metaY + 5);
  doc.text(`Payment: ${r.payment_method}`, colR, metaY + 5);
  doc.text(`Customer: ${r.customer_name}`, colL, metaY + 10);
  doc.text(
    `Status: ${r.payment_status.replace("_", " ").toUpperCase()}`,
    colR,
    metaY + 10,
  );

  // Items table
  autoTable(doc, {
    startY: metaY + 16,
    head: [["Product", "Qty", "Unit", "Discount", "Total"]],
    body: r.items.map((it) => [
      it.product_name,
      String(it.quantity),
      it.unit_price.toLocaleString(),
      it.discount_amount > 0 ? `-${it.discount_amount.toLocaleString()}` : "—",
      it.line_total.toLocaleString(),
    ]),
    headStyles: { fillColor: [240, 240, 240], textColor: 30, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 18 },
      2: { halign: "right", cellWidth: 26 },
      3: { halign: "right", cellWidth: 26 },
      4: { halign: "right", cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const totDiscount = r.total_line_discount + r.overall_discount_amount;
  const lineRight = pageW - 14;
  const totalsX = pageW - 70;
  doc.setFontSize(10);
  doc.text("Subtotal", totalsX, finalY);
  doc.text(`KES ${r.subtotal.toLocaleString()}`, lineRight, finalY, {
    align: "right",
  });
  let y = finalY + 5;
  if (totDiscount > 0) {
    doc.text("Discount", totalsX, y);
    doc.text(`-KES ${totDiscount.toLocaleString()}`, lineRight, y, {
      align: "right",
    });
    y += 5;
  }
  doc.setDrawColor(20);
  doc.line(totalsX, y + 0.5, lineRight, y + 0.5);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", totalsX, y);
  doc.text(`KES ${r.total.toLocaleString()}`, lineRight, y, { align: "right" });

  if (r.payment_status !== "paid") {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Amount paid", totalsX, y);
    doc.text(`KES ${r.amount_paid.toLocaleString()}`, lineRight, y, {
      align: "right",
    });
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Balance due", totalsX, y);
    doc.text(`KES ${r.balance_due.toLocaleString()}`, lineRight, y, {
      align: "right",
    });
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text(
    "Thank you for shopping with us!",
    pageW / 2,
    doc.internal.pageSize.getHeight() - 14,
    { align: "center" },
  );

  doc.save(`Receipt-${shortTxn(r.transactionId)}.pdf`);
}

function buildWhatsAppText(r: ReceiptData) {
  const totDiscount = r.total_line_discount + r.overall_discount_amount;
  const lines = r.items
    .map(
      (it) =>
        `• ${it.product_name}  ${it.quantity} × ${it.unit_price.toLocaleString()} = ${it.line_total.toLocaleString()}`,
    )
    .join("\n");
  return [
    `*${BUSINESS.name} — Receipt #${shortTxn(r.transactionId)}*`,
    `${formatDate(r.created_at)}`,
    `Cashier: ${r.sold_by}`,
    ``,
    lines,
    ``,
    `Subtotal: KES ${r.subtotal.toLocaleString()}`,
    totDiscount > 0 ? `Discount: -KES ${totDiscount.toLocaleString()}` : "",
    `*TOTAL: KES ${r.total.toLocaleString()}*`,
    r.payment_status !== "paid"
      ? `Paid: KES ${r.amount_paid.toLocaleString()}  ·  Balance: KES ${r.balance_due.toLocaleString()}`
      : "",
    ``,
    `Thank you for shopping with ${BUSINESS.name}!`,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function POSReceipt({
  receipt: r,
  onNewSale,
  onClose,
}: POSReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"a4" | "thermal" | "pdf" | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const totDiscount = r.total_line_discount + r.overall_discount_amount;

  function handlePrint(format: "a4" | "thermal") {
    setBusy(format);
    try {
      printInIframe(buildPrintableHtml(r, format));
    } finally {
      setTimeout(() => setBusy(null), 1000);
    }
  }

  async function handlePdf() {
    setBusy("pdf");
    try {
      await downloadPdf(r);
    } catch (err) {
      console.error(err);
      alert("PDF download failed.");
    } finally {
      setBusy(null);
    }
  }

  function handleWhatsApp() {
    const text = buildWhatsAppText(r);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildWhatsAppText(r));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-stretch sm:items-center justify-center sm:p-4">
      <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-4xl h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-5 py-3 bg-emerald-600 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sale complete</h2>
              <p className="text-xs text-emerald-50">
                Receipt #{shortTxn(r.transactionId)} ·{" "}
                KES {r.total.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-white/20 flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: preview + actions */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_280px] overflow-hidden">
          {/* Preview */}
          <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
            <div
              ref={summaryRef}
              className="mx-auto max-w-md bg-white text-slate-900 rounded-lg shadow-xl p-6"
            >
              <div className="text-center border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-black tracking-widest">
                  {BUSINESS.name}
                </h1>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {BUSINESS.tagline}
                </p>
                <p className="text-[11px] text-slate-500">
                  Tel: {BUSINESS.tel} · {BUSINESS.location}
                </p>
                <span className="inline-block mt-2 px-3 py-0.5 bg-slate-900 text-white text-[10px] font-bold tracking-widest rounded-full">
                  SALES RECEIPT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-1 gap-x-3 text-[12px] mt-3">
                <div>
                  <span className="text-slate-500">Receipt #</span>{" "}
                  <span className="font-mono font-semibold">
                    {shortTxn(r.transactionId)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date:</span>{" "}
                  {formatDate(r.created_at)}
                </div>
                <div>
                  <span className="text-slate-500">Cashier:</span> {r.sold_by}
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Payment:</span>{" "}
                  {r.payment_method}
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500">Customer:</span>{" "}
                  {r.customer_name}
                </div>
              </div>

              <table className="w-full mt-3 text-[12px] border-t border-slate-200">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="text-left py-1.5 pr-2">Item</th>
                    <th className="text-right py-1.5 w-10">Qty</th>
                    <th className="text-right py-1.5 w-20">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {r.items.map((it, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2">
                        <div className="font-medium">{it.product_name}</div>
                        <div className="text-[10px] text-slate-500">
                          KES {it.unit_price.toLocaleString()} each
                          {it.discount_amount > 0 && (
                            <span className="text-rose-600 ml-1">
                              · -{it.discount_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-1.5 text-right">{it.quantity}</td>
                      <td className="py-1.5 text-right font-semibold">
                        {it.line_total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 pt-3 border-t border-slate-200 space-y-1 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>KES {r.subtotal.toLocaleString()}</span>
                </div>
                {totDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Discount</span>
                    <span className="text-rose-600">
                      −KES {totDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1.5 mt-1.5 border-t-2 border-slate-900">
                  <span className="text-sm font-black">TOTAL</span>
                  <span className="text-lg font-black">
                    KES {r.total.toLocaleString()}
                  </span>
                </div>
                {r.payment_status !== "paid" && (
                  <>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-600">Amount paid</span>
                      <span>KES {r.amount_paid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-amber-700">
                        Balance due
                      </span>
                      <span className="font-bold text-amber-700">
                        KES {r.balance_due.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-center text-[10px] text-slate-500 mt-5 pt-3 border-t border-dashed border-slate-300">
                Thank you for shopping with {BUSINESS.name}!
                <br />
                {BUSINESS.email}
              </p>
            </div>
          </div>

          {/* Actions sidebar */}
          <div className="bg-white dark:bg-slate-800 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-2 overflow-y-auto">
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1">
              Print
            </p>
            <button
              type="button"
              onClick={() => handlePrint("a4")}
              disabled={busy !== null}
              className="h-11 px-3 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {busy === "a4" ? "Opening…" : "Print A4"}
            </button>
            <button
              type="button"
              onClick={() => handlePrint("thermal")}
              disabled={busy !== null}
              className="h-11 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              title="80mm receipt printer"
            >
              <Printer className="w-4 h-4" />
              {busy === "thermal" ? "Opening…" : "Print Thermal 80mm"}
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={busy !== null}
              className="h-11 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {busy === "pdf" ? "Generating…" : "Save as PDF"}
            </button>

            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-3 mb-1">
              Share
            </p>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="h-11 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Send on WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="h-11 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy as text
                </>
              )}
            </button>
            {(navigator as any).share && (
              <button
                type="button"
                onClick={() =>
                  (navigator as any)
                    .share({
                      title: `Receipt #${shortTxn(r.transactionId)}`,
                      text: buildWhatsAppText(r),
                    })
                    .catch(() => {})
                }
                className="h-11 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-bold flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share…
              </button>
            )}

            <div className="flex-1" />

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
              <button
                type="button"
                onClick={onNewSale}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                New sale
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
