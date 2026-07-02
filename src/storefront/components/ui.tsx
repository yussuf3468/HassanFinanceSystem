import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PackageOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "../lib/router";

/* ═══════════════════════════════════════════════════════════════
   Shared storefront primitives — section scaffolding, reveals,
   buttons, empty states, skeletons.
   ═══════════════════════════════════════════════════════════════ */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/** Fade-and-rise on first scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  linkTo,
  linkLabel,
  align = "left",
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  linkTo?: string;
  linkLabel?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  const centered = align === "center";
  return (
    <div
      className={`mb-10 flex flex-wrap items-end gap-6 sm:mb-12 ${
        centered ? "flex-col items-center text-center" : "justify-between"
      }`}
    >
      <div className={centered ? "max-w-2xl" : "max-w-xl"}>
        <p
          className="sf-eyebrow mb-3"
          style={{ color: dark ? "var(--sf-dark-ink-soft)" : "var(--sf-gold)" }}
        >
          {eyebrow}
        </p>
        <h2
          className="sf-display sf-balance text-3xl font-medium leading-[1.08] sm:text-4xl lg:text-[2.75rem]"
          style={{ color: dark ? "var(--sf-dark-ink)" : "var(--sf-ink)" }}
        >
          {title}
        </h2>
        {description && (
          <p
            className="mt-4 text-[15px] leading-relaxed"
            style={{
              color: dark ? "var(--sf-dark-ink-soft)" : "var(--sf-ink-soft)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="sf-link group inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: dark ? "var(--sf-dark-ink)" : "var(--sf-ink)" }}
        >
          {linkLabel ?? "View all"}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function SolidButton({
  children,
  onClick,
  to,
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
  disabled?: boolean;
}) {
  const base = `group inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-7 text-[15px] font-semibold transition-all duration-300 will-change-transform hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${className}`;
  const style = {
    background: "var(--sf-accent)",
    color: "var(--sf-accent-ink)",
    boxShadow: "var(--sf-shadow-accent)",
  } as const;
  if (to) {
    return (
      <Link to={to} className={base} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={base} style={style}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  to,
  dark = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  to?: string;
  dark?: boolean;
  className?: string;
}) {
  const base = `inline-flex h-12 items-center justify-center gap-2.5 rounded-full border px-7 text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 ${className}`;
  const style = dark
    ? {
        borderColor: "rgba(245,242,234,0.28)",
        color: "var(--sf-dark-ink)",
        background: "rgba(255,255,255,0.06)",
      }
    : {
        borderColor: "var(--sf-line-strong)",
        color: "var(--sf-ink)",
        background: "transparent",
      };
  if (to) {
    return (
      <Link to={to} className={base} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base} style={style}>
      {children}
    </button>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-all duration-200"
      style={
        active
          ? {
              background: "var(--sf-ink)",
              color: "var(--sf-bg)",
              borderColor: "var(--sf-ink)",
            }
          : {
              background: "var(--sf-surface)",
              color: "var(--sf-ink-soft)",
              borderColor: "var(--sf-line)",
            }
      }
    >
      {children}
    </button>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ background: "var(--sf-accent-soft)" }}
      >
        <PackageOpen className="h-9 w-9" style={{ color: "var(--sf-accent)" }} />
      </div>
      <h3 className="sf-display text-2xl font-medium" style={{ color: "var(--sf-ink)" }}>
        {title}
      </h3>
      <p
        className="mt-2 max-w-sm text-[15px] leading-relaxed"
        style={{ color: "var(--sf-ink-soft)" }}
      >
        {body}
      </p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-3xl"
      style={{ background: "var(--sf-surface)", border: "1px solid var(--sf-line)" }}
    >
      <div className="sf-shimmer aspect-[4/5]" />
      <div className="space-y-2.5 p-5">
        <div className="sf-shimmer h-3 w-1/3 rounded-full" />
        <div className="sf-shimmer h-4 w-4/5 rounded-full" />
        <div className="sf-shimmer h-5 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
