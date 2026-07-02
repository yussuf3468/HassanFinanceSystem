import {
  Clock,
  Headphones,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { Container, GhostButton, Reveal, SolidButton } from "../components/ui";
import { storeConfig } from "../config/store";

/* ═══════════════════════════════════════════════════════════════
   ABOUT — the business story told properly: origin, numbers,
   values, and an invitation to visit.
   ═══════════════════════════════════════════════════════════════ */

const VALUE_ICONS = {
  shield: ShieldCheck,
  truck: Truck,
  sparkles: Sparkles,
  clock: Clock,
  wallet: Wallet,
  headset: Headphones,
} as const;

export default function AboutPage() {
  const { story, valueProps, contact } = storeConfig;

  return (
    <div className="pb-16">
      {/* Dark opening statement */}
      <section
        className="sf-grain relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44"
        style={{ background: "var(--sf-dark)" }}
      >
        <div className="sf-aurora" />
        <Container className="relative z-[2] max-w-3xl text-center">
          <Reveal>
            <p className="sf-eyebrow mb-5" style={{ color: "var(--sf-gold)" }}>
              {story.eyebrow}
            </p>
            <h1
              className="sf-display sf-balance text-4xl font-medium leading-[1.08] sm:text-6xl"
              style={{ color: "var(--sf-dark-ink)" }}
            >
              {story.title}
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed sm:text-lg"
              style={{ color: "var(--sf-dark-ink-soft)" }}
            >
              {storeConfig.positioning}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Narrative + stats */}
      <section className="py-16 sm:py-24">
        <Container className="max-w-3xl">
          <Reveal>
            <div className="space-y-6">
              {story.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="sf-display text-xl font-normal leading-relaxed sm:text-2xl"
                  style={{ color: "var(--sf-ink)" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {story.stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl p-6 text-center"
                  style={{
                    background: "var(--sf-surface)",
                    border: "1px solid var(--sf-line)",
                    boxShadow: "var(--sf-shadow-sm)",
                  }}
                >
                  <p
                    className="sf-display text-2xl font-semibold sm:text-3xl"
                    style={{ color: "var(--sf-accent)" }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="mt-1.5 text-[12.5px] font-medium"
                    style={{ color: "var(--sf-ink-soft)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Values */}
      <section className="py-4 sm:py-8">
        <Container>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((prop, index) => {
              const Icon = VALUE_ICONS[prop.icon];
              return (
                <Reveal key={prop.title} delay={index * 0.07}>
                  <div
                    className="h-full rounded-3xl p-7"
                    style={{
                      background: "var(--sf-surface)",
                      border: "1px solid var(--sf-line)",
                      boxShadow: "var(--sf-shadow-sm)",
                    }}
                  >
                    <div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: "var(--sf-accent-soft)" }}
                    >
                      <Icon className="h-[22px] w-[22px]" style={{ color: "var(--sf-accent)" }} />
                    </div>
                    <h3
                      className="mb-2 text-[16px] font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {prop.title}
                    </h3>
                    <p
                      className="text-[13.5px] leading-relaxed"
                      style={{ color: "var(--sf-ink-soft)" }}
                    >
                      {prop.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Visit CTA */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <div
              className="flex flex-col items-center gap-6 rounded-[2rem] px-8 py-14 text-center"
              style={{
                background: "var(--sf-bg-soft)",
                border: "1px solid var(--sf-line)",
              }}
            >
              <MapPin className="h-8 w-8" style={{ color: "var(--sf-accent)" }} />
              <div>
                <h2
                  className="sf-display text-3xl font-medium"
                  style={{ color: "var(--sf-ink)" }}
                >
                  Come say hello
                </h2>
                <p className="mt-3 text-[15px]" style={{ color: "var(--sf-ink-soft)" }}>
                  {contact.address} · {contact.hours[0]?.days} {contact.hours[0]?.time}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <SolidButton to="/products">Shop online instead</SolidButton>
                <GhostButton to="/contact">Contact details</GhostButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
