import type { OrderStatus } from "../types";

export const orderStatusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export const customerVisibleStatusSteps: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const statusLabelMap: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusDescriptionMap: Record<OrderStatus, string> = {
  pending: "We received your order and will review it shortly.",
  confirmed: "Your order has been confirmed by the store.",
  processing: "Your items are being prepared for dispatch.",
  shipped: "Your order is on the way.",
  delivered: "Your order was delivered successfully.",
  cancelled: "This order was cancelled.",
};

const statusBadgeClassMap: Record<OrderStatus, string> = {
  pending:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  confirmed:
    "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
  processing:
    "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
  shipped:
    "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200",
  delivered:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
  cancelled:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return statusLabelMap[status] ?? "Unknown";
}

export function getOrderStatusDescription(status: OrderStatus): string {
  return statusDescriptionMap[status] ?? "";
}

export function getOrderStatusBadgeClass(status: OrderStatus): string {
  return (
    statusBadgeClassMap[status] ??
    "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
  );
}

export function getOrderStatusStepIndex(status: OrderStatus): number {
  return customerVisibleStatusSteps.indexOf(status);
}
