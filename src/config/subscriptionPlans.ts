/* ═══════════════════════════════════════════════════════════════
   SUBSCRIPTION PLANS

   The store runs on a Lenzro subscription. Plans and limits here
   mirror the database (see migration 20260705000000_subscription_plans):
   the product limit is also enforced by a Postgres trigger, so the
   client and server never disagree.
   ═══════════════════════════════════════════════════════════════ */

export type PlanId = "free" | "pro" | "max";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in USD, used to compare upgrade vs. downgrade. */
  priceMonthly: number;
  /** Display label, e.g. "$55". */
  priceLabel: string;
  /** Max published + unpublished products; null = unlimited. */
  productLimit: number | null;
  features: string[];
  highlight?: boolean;
}

/** WhatsApp line for Lenzro billing (upgrades & payment details). */
export const BILLING_WHATSAPP = "254722979547";

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Get your shop online",
    priceMonthly: 0,
    priceLabel: "$0",
    productLimit: 50,
    features: [
      "Up to 50 products",
      "Online storefront & cart",
      "Point of sale & sales history",
      "Order management",
      "1 staff account",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For a growing bookshop",
    priceMonthly: 55,
    priceLabel: "$55",
    productLimit: 500,
    features: [
      "Up to 500 products",
      "Everything in Free",
      "Financial dashboard & reports",
      "Expenses, debts & credit tracking",
      "Unlimited staff accounts",
      "Priority WhatsApp support",
    ],
    highlight: true,
  },
  {
    id: "max",
    name: "Max",
    tagline: "No limits, full power",
    priceMonthly: 149,
    priceLabel: "$149",
    productLimit: null,
    features: [
      "Unlimited products",
      "Everything in Pro",
      "Profit tracker & investments",
      "Cyber services module",
      "Early access to new features",
      "Dedicated account manager",
    ],
  },
];

const PLAN_BY_ID: Record<PlanId, SubscriptionPlan> = SUBSCRIPTION_PLANS.reduce(
  (acc, plan) => {
    acc[plan.id] = plan;
    return acc;
  },
  {} as Record<PlanId, SubscriptionPlan>,
);

/** Resolve a plan by id, defaulting to Free for unknown/undefined values. */
export function getPlan(planId?: string | null): SubscriptionPlan {
  if (planId && planId in PLAN_BY_ID) return PLAN_BY_ID[planId as PlanId];
  return PLAN_BY_ID.free;
}

export function formatProductLimit(limit: number | null): string {
  return limit === null ? "Unlimited" : limit.toLocaleString();
}
