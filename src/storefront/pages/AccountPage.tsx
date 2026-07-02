import { lazy, Suspense } from "react";
import { PackageSearch, UserRound } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Container, GhostButton, Reveal, SolidButton } from "../components/ui";

const CustomerDashboard = lazy(
  () => import("../../components/ecommerce/CustomerDashboard"),
);

/* ═══════════════════════════════════════════════════════════════
   ACCOUNT — signed-out visitors get a warm invitation (orders
   work without an account); signed-in customers get the full
   dashboard.
   ═══════════════════════════════════════════════════════════════ */

export default function AccountPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="pb-16 pt-24 sm:pt-28">
        <Container className="max-w-xl">
          <Reveal>
            <div
              className="rounded-[2rem] p-9 text-center sm:p-12"
              style={{
                background: "var(--sf-surface)",
                border: "1px solid var(--sf-line)",
                boxShadow: "var(--sf-shadow-md)",
              }}
            >
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl"
                style={{ background: "var(--sf-accent-soft)" }}
              >
                <UserRound className="h-8 w-8" style={{ color: "var(--sf-accent)" }} />
              </div>
              <h1
                className="sf-display text-3xl font-medium"
                style={{ color: "var(--sf-ink)" }}
              >
                Good news: no account needed
              </h1>
              <p
                className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed"
                style={{ color: "var(--sf-ink-soft)" }}
              >
                Checkout works without signing up — just your name and phone
                number. Your order number tracks everything.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <SolidButton to="/products">Start shopping</SolidButton>
                <GhostButton to="/track">
                  <PackageSearch className="h-4 w-4" />
                  Track an order
                </GhostButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </div>
    );
  }

  return (
    <div className="pb-16 pt-20 sm:pt-24">
      <Suspense
        fallback={
          <Container>
            <div className="sf-shimmer h-64 rounded-3xl" />
          </Container>
        }
      >
        <CustomerDashboard />
      </Suspense>
    </div>
  );
}
