import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { signInWithPassword } from "../api";

/* ═══════════════════════════════════════════════════════════════
   Staff sign-in — the gate to the back office, styled to match
   the storefront identity (porcelain card, evergreen accent,
   serif monogram). The host page (App.tsx) provides the dark
   backdrop; this component is just the card.
   ═══════════════════════════════════════════════════════════════ */

const EVERGREEN = "#1d5c45";
const EVERGREEN_DEEP = "#123c2d";
const INK = "#191511";
const INK_SOFT = "#5f584c";
const INK_FAINT = "#99917f";
const LINE = "rgba(24, 20, 12, 0.1)";
const IVORY = "#f5f2ea";
const GOLD = "#b9863a";
const SERIF = '"Fraunces", Georgia, serif';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await signInWithPassword(
        credentials.email,
        credentials.password,
      );

      if (data.user) {
        onLogin(data.user);
      }
    } catch (error: any) {
      if (error?.message?.includes("Invalid login credentials")) {
        setError(
          "Magaca isticmaalaha ama furaha sirta ah ayaa qaldan - Invalid email or password",
        );
      } else {
        console.error("Login error:", error);
        setError(
          "Khalad ayaa dhacay - An error occurred: " +
            (error?.message || "Network error occurred"),
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "#faf8f4",
    border: `1px solid ${LINE}`,
    color: INK,
  };

  return (
    <div
      className="overflow-hidden rounded-[2rem]"
      style={{
        background: "#ffffff",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}
    >
      <div className="p-8 sm:p-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, #236b51, ${EVERGREEN_DEEP})`,
              boxShadow: "0 12px 32px rgba(46,143,108,0.3)",
            }}
          >
            <span
              className="text-2xl font-semibold"
              style={{ fontFamily: SERIF, color: IVORY }}
            >
              H
            </span>
          </div>
          <p
            className="mb-1.5 text-[11px] font-semibold uppercase"
            style={{ color: GOLD, letterSpacing: "0.22em" }}
          >
            Hassan Bookshop
          </p>
          <h1
            className="text-[1.75rem] font-medium tracking-tight"
            style={{ fontFamily: SERIF, color: INK }}
          >
            Staff sign in
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: INK_SOFT }}>
            Gal — welcome back to the back office
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div
              className="rounded-2xl px-4 py-3 text-sm"
              style={{
                background: "rgba(220, 38, 38, 0.06)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="staff-email"
              className="mb-1.5 block text-[13px] font-semibold"
              style={{ color: INK }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                style={{ color: INK_FAINT }}
              />
              <input
                id="staff-email"
                type="email"
                required
                autoComplete="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                placeholder="you@hassanbookshop.co.ke"
                className="h-12 w-full rounded-2xl pl-11 pr-4 text-[15px] outline-none transition-shadow focus:ring-2"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="staff-password"
              className="mb-1.5 block text-[13px] font-semibold"
              style={{ color: INK }}
            >
              Password · Furaha sirta ah
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                style={{ color: INK_FAINT }}
              />
              <input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="••••••••"
                className="h-12 w-full rounded-2xl pl-11 pr-12 text-[15px] outline-none transition-shadow focus:ring-2"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ color: INK_FAINT }}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2.5 rounded-full text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
            style={{
              background: EVERGREEN,
              boxShadow: "0 12px 32px rgba(46,143,108,0.35)",
            }}
          >
            {loading ? (
              <>
                <span
                  className="inline-block h-[18px] w-[18px] animate-spin rounded-full"
                  style={{
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#ffffff",
                  }}
                />
                Ku soo galaya…
              </>
            ) : (
              "Sign in · Gal"
            )}
          </button>
        </form>

        {/* Access note */}
        <div
          className="mt-7 flex items-start gap-3 rounded-2xl px-4 py-3.5"
          style={{ background: "#faf8f4", border: `1px solid ${LINE}` }}
        >
          <ShieldCheck
            className="mt-0.5 h-[18px] w-[18px] shrink-0"
            style={{ color: EVERGREEN }}
          />
          <p className="text-[12.5px] leading-relaxed" style={{ color: INK_SOFT }}>
            Staff access only — contact the administrator if you need an
            account.{" "}
            <span className="italic" style={{ color: INK_FAINT }}>
              La xiriir maamulaha haddii aad u baahato gelitaan.
            </span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-8 py-4 text-center"
        style={{ borderTop: `1px solid ${LINE}`, background: "#faf8f4" }}
      >
        <a
          href="https://lenzro.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] transition-opacity hover:opacity-70"
          style={{ color: INK_FAINT }}
        >
          Crafted by{" "}
          <span className="font-semibold" style={{ color: INK }}>
            Lenzro
          </span>
        </a>
      </div>
    </div>
  );
}
