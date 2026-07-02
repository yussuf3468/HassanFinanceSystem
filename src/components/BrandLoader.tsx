/* ═══════════════════════════════════════════════════════════════
   Branded loading states — match the storefront identity
   (porcelain canvas, evergreen accent, serif monogram) so the
   first paint and every suspense gap feel like the same product.
   Self-contained styles: safe outside the storefront shell and
   immune to the dark-mode class.
   ═══════════════════════════════════════════════════════════════ */

const EVERGREEN = "#1d5c45";
const EVERGREEN_DEEP = "#123c2d";
const PORCELAIN = "#faf8f4";
const INK_SOFT = "#5f584c";
const IVORY = "#f5f2ea";
const SERIF = '"Fraunces", Georgia, serif';

function SpinnerRing({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full"
      style={{
        width: size,
        height: size,
        border: `2.5px solid ${EVERGREEN}22`,
        borderTopColor: EVERGREEN,
      }}
    />
  );
}

/** Full-screen loader shown while the session boots. */
export function AppLoader({ label = "Hassan Bookshop" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{ background: PORCELAIN }}
    >
      <div
        className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl"
        style={{
          background: `linear-gradient(135deg, #236b51, ${EVERGREEN_DEEP})`,
          boxShadow: "0 12px 32px rgba(46, 143, 108, 0.35)",
        }}
      >
        <span
          className="text-3xl font-semibold"
          style={{ fontFamily: SERIF, color: IVORY }}
        >
          H
        </span>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p
          className="text-xl font-medium tracking-tight"
          style={{ fontFamily: SERIF, color: "#191511" }}
        >
          {label}
        </p>
        <SpinnerRing />
        <p className="text-[13px]" style={{ color: INK_SOFT }}>
          Iska sug · Just a moment
        </p>
      </div>
    </div>
  );
}

/** Compact loader for view-level suspense inside the admin shell. */
export function ViewLoader({ label = "Loading view…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20">
      <SpinnerRing size={18} />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
        {label}
      </span>
    </div>
  );
}
