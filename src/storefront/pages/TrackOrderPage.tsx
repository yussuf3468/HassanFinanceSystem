import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  PackageSearch,
  Search,
  Truck,
} from "lucide-react";
import { Container, Reveal } from "../components/ui";
import { storeConfig } from "../config/store";
import { useStorefrontUI } from "../lib/ui-context";

/* ═══════════════════════════════════════════════════════════════
   TRACK ORDER — order-number entry with the journey explained.
   The lookup itself opens the proven tracking dialog (shared
   with checkout confirmations).
   ═══════════════════════════════════════════════════════════════ */

const JOURNEY = [
  {
    icon: ClipboardList,
    title: "Order placed",
    body: "We receive your order instantly and start picking your items.",
  },
  {
    icon: CheckCircle2,
    title: "Confirmed",
    body: "Payment verified and everything reserved under your name.",
  },
  {
    icon: Truck,
    title: "On the way",
    body: "A rider is moving — same day within Nairobi.",
  },
  {
    icon: PackageCheck,
    title: "Delivered",
    body: "Enjoy! Returns are easy within 7 days if anything's off.",
  },
];

export default function TrackOrderPage() {
  const ui = useStorefrontUI();
  const [orderNumber, setOrderNumber] = useState(
    () => localStorage.getItem("lastOrderNumber") ?? "",
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    ui.openTracking(orderNumber.trim() || undefined);
  }

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container className="max-w-3xl">
        <Reveal>
          <div className="mb-10 text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: "var(--sf-accent-soft)" }}
            >
              <PackageSearch className="h-8 w-8" style={{ color: "var(--sf-accent)" }} />
            </div>
            <h1
              className="sf-display sf-balance text-4xl font-medium sm:text-5xl"
              style={{ color: "var(--sf-ink)" }}
            >
              Where's my order?
            </h1>
            <p
              className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              Enter the order number from your confirmation — or track with the
              phone number you ordered with.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-xl items-center gap-2 rounded-full p-2"
            style={{
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-line)",
              boxShadow: "var(--sf-shadow-md)",
            }}
          >
            <Search className="ml-3 h-5 w-5 shrink-0" style={{ color: "var(--sf-ink-faint)" }} />
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. ORD-2024-0001"
              aria-label="Order number"
              className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              style={{ color: "var(--sf-ink)" }}
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full px-6 text-[14px] font-semibold transition-transform hover:scale-105"
              style={{ background: "var(--sf-accent)", color: "var(--sf-accent-ink)" }}
            >
              Track
            </button>
          </form>
        </Reveal>

        {/* The journey */}
        <Reveal delay={0.2}>
          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            {JOURNEY.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-3xl p-6"
                  style={{
                    background: "var(--sf-surface)",
                    border: "1px solid var(--sf-line)",
                  }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: "var(--sf-accent-soft)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--sf-accent)" }} />
                  </div>
                  <div>
                    <p
                      className="text-[12px] font-semibold"
                      style={{ color: "var(--sf-ink-faint)" }}
                    >
                      Step {index + 1}
                    </p>
                    <h2
                      className="mt-0.5 text-[15px] font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {step.title}
                    </h2>
                    <p
                      className="mt-1 text-[13.5px] leading-relaxed"
                      style={{ color: "var(--sf-ink-soft)" }}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <p
            className="mt-10 text-center text-[13.5px]"
            style={{ color: "var(--sf-ink-soft)" }}
          >
            Can't find your order number? WhatsApp us on{" "}
            <a
              href={`https://wa.me/${storeConfig.contact.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline"
              style={{ color: "var(--sf-accent)" }}
            >
              {storeConfig.contact.phone}
            </a>{" "}
            and we'll find it for you.
          </p>
        </Reveal>
      </Container>
    </div>
  );
}
