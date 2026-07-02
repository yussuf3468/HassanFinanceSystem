import {
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { useState } from "react";
import compactToast from "../../utils/compactToast";
import { Container, Reveal } from "../components/ui";
import { storeConfig } from "../config/store";

/* ═══════════════════════════════════════════════════════════════
   CONTACT — the channels people actually use here (call,
   WhatsApp) given equal billing with the form. The form hands
   off to WhatsApp so every message reaches a human immediately.
   ═══════════════════════════════════════════════════════════════ */

export default function ContactPage() {
  const { contact } = storeConfig;
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      compactToast.error("Please add your name and a short message");
      return;
    }
    const text = encodeURIComponent(
      `Hello ${storeConfig.name}! I'm ${form.name}${
        form.phone ? ` (${form.phone})` : ""
      }.\n\n${form.message}`,
    );
    window.open(`https://wa.me/${contact.whatsapp}?text=${text}`, "_blank");
    compactToast.success("Opening WhatsApp with your message…");
  }

  const channels = [
    {
      icon: Phone,
      title: "Call us",
      body: contact.phone,
      href: `tel:${contact.phone.replace(/\s/g, "")}`,
      cta: "Call now",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      body: "Fastest replies, 7 days a week",
      href: `https://wa.me/${contact.whatsapp}`,
      cta: "Open chat",
    },
    {
      icon: Mail,
      title: "Email",
      body: contact.email,
      href: `mailto:${contact.email}`,
      cta: "Write to us",
    },
    {
      icon: MapPin,
      title: "Visit the shop",
      body: contact.address,
      href: contact.mapsUrl ?? "#",
      cta: "Get directions",
    },
  ];

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-2xl sm:mb-14">
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              Talk to a human
            </p>
            <h1
              className="sf-display sf-balance text-4xl font-medium leading-[1.06] sm:text-5xl"
              style={{ color: "var(--sf-ink)" }}
            >
              We're easy to reach
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed sm:text-base"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              Questions about stock, bulk orders for schools and offices, or a
              delivery on its way — a real person answers on every channel.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          {/* Channels */}
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Reveal key={channel.title} delay={index * 0.06}>
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group flex h-full flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1"
                    style={{
                      background: "var(--sf-surface)",
                      border: "1px solid var(--sf-line)",
                      boxShadow: "var(--sf-shadow-sm)",
                    }}
                  >
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ background: "var(--sf-accent-soft)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "var(--sf-accent)" }} />
                    </div>
                    <h2
                      className="text-[15.5px] font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {channel.title}
                    </h2>
                    <p
                      className="mt-1 flex-1 break-words text-[13.5px] leading-relaxed"
                      style={{ color: "var(--sf-ink-soft)" }}
                    >
                      {channel.body}
                    </p>
                    <span
                      className="sf-link mt-4 text-[13px] font-semibold"
                      style={{ color: "var(--sf-accent)" }}
                    >
                      {channel.cta} →
                    </span>
                  </a>
                </Reveal>
              );
            })}

            {/* Hours */}
            <Reveal delay={0.25} className="sm:col-span-2">
              <div
                className="flex items-center gap-4 rounded-3xl p-6"
                style={{
                  background: "var(--sf-bg-soft)",
                  border: "1px solid var(--sf-line)",
                }}
              >
                <Clock className="h-6 w-6 shrink-0" style={{ color: "var(--sf-accent)" }} />
                <div className="flex flex-wrap gap-x-10 gap-y-1 text-[14px]">
                  {contact.hours.map((h) => (
                    <p key={h.days} style={{ color: "var(--sf-ink-soft)" }}>
                      <span className="font-semibold" style={{ color: "var(--sf-ink)" }}>
                        {h.days}:
                      </span>{" "}
                      {h.time}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Message form */}
          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] p-7 sm:p-9"
              style={{
                background: "var(--sf-surface)",
                border: "1px solid var(--sf-line)",
                boxShadow: "var(--sf-shadow-md)",
              }}
            >
              <h2
                className="sf-display text-2xl font-medium"
                style={{ color: "var(--sf-ink)" }}
              >
                Send a message
              </h2>
              <p className="mt-2 text-[13.5px]" style={{ color: "var(--sf-ink-soft)" }}>
                We'll open WhatsApp with your message ready to send — replies
                usually come within minutes.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: "var(--sf-ink)" }}
                    htmlFor="contact-name"
                  >
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Wanjiku"
                    className="h-12 w-full rounded-2xl px-4 text-[15px] outline-none transition-shadow focus:ring-2"
                    style={{
                      background: "var(--sf-bg)",
                      border: "1px solid var(--sf-line)",
                      color: "var(--sf-ink)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: "var(--sf-ink)" }}
                    htmlFor="contact-phone"
                  >
                    Phone (optional)
                  </label>
                  <input
                    id="contact-phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+254 7…"
                    className="h-12 w-full rounded-2xl px-4 text-[15px] outline-none"
                    style={{
                      background: "var(--sf-bg)",
                      border: "1px solid var(--sf-line)",
                      color: "var(--sf-ink)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: "var(--sf-ink)" }}
                    htmlFor="contact-message"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="I'm looking for…"
                    rows={5}
                    className="w-full resize-none rounded-2xl px-4 py-3 text-[15px] outline-none"
                    style={{
                      background: "var(--sf-bg)",
                      border: "1px solid var(--sf-line)",
                      color: "var(--sf-ink)",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: "var(--sf-accent)",
                    color: "var(--sf-accent-ink)",
                    boxShadow: "var(--sf-shadow-accent)",
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send via WhatsApp
                </button>
              </div>
            </form>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
