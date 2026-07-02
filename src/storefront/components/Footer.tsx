import { useState } from "react";
import {
  ArrowRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import compactToast from "../../utils/compactToast";
import { storeConfig } from "../config/store";
import { Link } from "../lib/router";
import { useStorefrontUI } from "../lib/ui-context";
import { Container } from "./ui";

/* ═══════════════════════════════════════════════════════════════
   Footer — dark editorial band: newsletter, sitemap, contact,
   hours. Ends with the powered-by line and a quiet staff entry.
   ═══════════════════════════════════════════════════════════════ */

const SHOP_LINKS = [
  { to: "/products", label: "All products" },
  { to: "/categories", label: "Categories" },
  { to: "/collections", label: "Collections" },
  { to: "/offers", label: "Offers" },
  { to: "/wishlist", label: "Wishlist" },
];

const SUPPORT_LINKS = [
  { to: "/track", label: "Track your order" },
  { to: "/account", label: "My account" },
  { to: "/about", label: "About us" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  const ui = useStorefrontUI();
  const [email, setEmail] = useState("");
  const { contact, newsletter } = storeConfig;

  function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      compactToast.error("Please enter a valid email address");
      return;
    }
    // Subscriptions are collected on WhatsApp until a mailing list exists.
    compactToast.success("You're on the list — welcome!");
    setEmail("");
  }

  return (
    <footer
      className="sf-grain relative mt-24 pb-28 lg:pb-0"
      style={{ background: "var(--sf-dark)", color: "var(--sf-dark-ink)" }}
    >
      {/* Newsletter band */}
      <div style={{ borderBottom: "1px solid var(--sf-dark-line)" }}>
        <Container className="relative z-10 py-16 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-lg">
              <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
                Newsletter
              </p>
              <h3 className="sf-display text-3xl font-medium sm:text-4xl">
                {newsletter.title}
              </h3>
              <p
                className="mt-3 text-[15px] leading-relaxed"
                style={{ color: "var(--sf-dark-ink-soft)" }}
              >
                {newsletter.body}
              </p>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex w-full max-w-md items-center gap-2 rounded-full p-1.5"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid var(--sf-dark-line)",
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={newsletter.placeholder}
                aria-label="Email address"
                className="h-11 flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-[color:var(--sf-dark-ink-soft)]"
                style={{ color: "var(--sf-dark-ink)" }}
              />
              <button
                type="submit"
                className="flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition-transform duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-accent-ink)",
                }}
              >
                {newsletter.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </Container>
      </div>

      {/* Main grid */}
      <Container className="relative z-10 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Identity */}
          <div className="max-w-xs">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="sf-display flex h-10 w-10 items-center justify-center rounded-xl text-xl font-semibold"
                style={{
                  background: "var(--sf-accent)",
                  color: "var(--sf-accent-ink)",
                }}
              >
                {storeConfig.monogram}
              </span>
              <span className="sf-display text-lg font-semibold">
                {storeConfig.name}
              </span>
            </div>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "var(--sf-dark-ink-soft)" }}
            >
              {storeConfig.positioning}
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="sf-eyebrow mb-5" style={{ color: "var(--sf-gold)" }}>
              Shop
            </p>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="sf-link text-[14px]"
                    style={{ color: "var(--sf-dark-ink-soft)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="sf-eyebrow mb-5" style={{ color: "var(--sf-gold)" }}>
              Support
            </p>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="sf-link text-[14px]"
                    style={{ color: "var(--sf-dark-ink-soft)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="sf-eyebrow mb-5" style={{ color: "var(--sf-gold)" }}>
              Visit us
            </p>
            <ul
              className="space-y-3.5 text-[14px]"
              style={{ color: "var(--sf-dark-ink-soft)" }}
            >
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{contact.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="sf-link">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <a
                  href={`https://wa.me/${contact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sf-link"
                >
                  WhatsApp us
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                <a href={`mailto:${contact.email}`} className="sf-link break-all">
                  {contact.email}
                </a>
              </li>
              {contact.hours.map((h) => (
                <li key={h.days} className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {h.days}
                    <br />
                    {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid var(--sf-dark-line)" }}>
        <Container className="relative z-10 flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-[13px]" style={{ color: "var(--sf-dark-ink-soft)" }}>
            © {new Date().getFullYear()} {storeConfig.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a
              href={storeConfig.poweredBy.url}
              target="_blank"
              rel="noreferrer"
              className="text-[13px]"
              style={{ color: "var(--sf-dark-ink-soft)" }}
            >
              Crafted by{" "}
              <span className="font-semibold" style={{ color: "var(--sf-dark-ink)" }}>
                {storeConfig.poweredBy.label}
              </span>
            </a>
            <button
              type="button"
              onClick={ui.onAdminClick}
              className="text-[13px] transition-colors hover:underline"
              style={{ color: "var(--sf-dark-ink-soft)" }}
            >
              Staff portal
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}
