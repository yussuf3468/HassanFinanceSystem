import { Check, Crown, Leaf, MessageCircle, Package, Rocket } from "lucide-react";
import { useProducts, useStoreSubscription } from "../hooks/useSupabaseQuery";
import {
  BILLING_WHATSAPP,
  SUBSCRIPTION_PLANS,
  formatProductLimit,
  getPlan,
  type PlanId,
} from "../config/subscriptionPlans";
import { formatDate } from "../utils/dateFormatter";

const PLAN_ICONS: Record<PlanId, typeof Leaf> = {
  free: Leaf,
  pro: Rocket,
  max: Crown,
};

function upgradeLink(planName: string, priceLabel: string) {
  const message =
    `Hi! I'd like to upgrade my Hassan Bookshop store to the ` +
    `${planName} plan (${priceLabel}/month). Please send me the payment details.`;
  return `https://wa.me/${BILLING_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function Subscription() {
  const { data: products = [] } = useProducts();
  const { data: subscription } = useStoreSubscription();

  const currentPlan = getPlan(subscription?.plan);
  const used = products.length;
  const limit = currentPlan.productLimit;
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atLimit = limit !== null && used >= limit;

  const barColor = atLimit
    ? "bg-red-500"
    : pct >= 70
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Subscription & Plans
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs sm:text-sm">
          Your current plan, usage, and upgrade options
        </p>
      </div>

      {/* Current plan + usage */}
      <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
              <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  {currentPlan.name} plan
                </p>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase tracking-wide">
                  Current
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {currentPlan.priceLabel}/month ·{" "}
                {formatProductLimit(currentPlan.productLimit)} products
                {subscription?.renews_at &&
                  ` · renews ${formatDate(subscription.renews_at)}`}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {used.toLocaleString()}
              {limit !== null && (
                <span className="text-base font-semibold text-slate-400 dark:text-slate-500">
                  {" "}
                  / {limit.toLocaleString()}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              products used
            </p>
          </div>
        </div>

        {/* Usage bar */}
        {limit !== null && (
          <div className="mt-4">
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {atLimit ? (
              <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
                You've reached your product limit — upgrade to add more
                products.
              </p>
            ) : pct >= 70 ? (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                You're at {pct}% of your product limit.
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const Icon = PLAN_ICONS[plan.id];
          const isCurrent = plan.id === currentPlan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border-2 p-5 sm:p-6 bg-white dark:bg-slate-800 shadow-sm transition-shadow hover:shadow-md ${
                plan.highlight
                  ? "border-emerald-400 dark:border-emerald-600"
                  : "border-slate-100 dark:border-slate-700"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide shadow-sm">
                  Most popular
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    plan.highlight
                      ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {plan.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {plan.priceLabel}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  /month
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {formatProductLimit(plan.productLimit)} products
              </p>

              <ul className="mt-4 space-y-2 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-default"
                  >
                    Current plan
                  </button>
                ) : (
                  <a
                    href={upgradeLink(plan.name, plan.priceLabel)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {plan.priceMonthly >
                    (currentPlan.priceMonthly ?? 0)
                      ? `Upgrade to ${plan.name}`
                      : `Switch to ${plan.name}`}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* How upgrades work */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300">
        <p className="font-semibold mb-1">How upgrading works</p>
        <p>
          Tap an upgrade button to message us on WhatsApp. Once payment is
          confirmed, your plan is activated within minutes — no downtime, and
          all your products and data stay exactly as they are.
        </p>
      </div>
    </div>
  );
}
