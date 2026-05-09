import { memo, useCallback, useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Star,
  Truck,
  Shield,
  Phone,
  MapPin,
  Zap,
  ChevronDown,
  Flame,
  Gift,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import FeaturedProducts from "./FeaturedProducts";
import type { Product } from "../types";

/* ─── Announcement ticker data ──────────────────────────────────────── */
const TICKERS = [
  "📚 New Stock: Cambridge & KCSE Textbooks Just Arrived!",
  "🎒 Buy Any 2 Backpacks, Get 10% Off — Today Only!",
  "✏️ Stationery Bundle Deals Starting from KES 150",
  "🚚 Free Delivery on Orders Over KES 2,000 Within Nairobi",
  "💻 Latest Casio Calculators Now In Stock",
  "⭐ Rated #1 Bookshop in Eastleigh — 5,000+ Happy Students",
];

/* ─── Category data ──────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    icon: "📚",
    label: "Textbooks",
    somali: "Buugaag Waxbarasho",
    count: "1,000+",
    badge: "Bestseller",
    badgeColor: "bg-blue-500",
    from: "#3b82f6",
    bgLight: "#eff6ff",
    bgLightTo: "#dbeafe",
  },
  {
    icon: "✏️",
    label: "Stationery",
    somali: "Alaabta Qoraalka",
    count: "500+",
    badge: "New Deals",
    badgeColor: "bg-amber-500",
    from: "#f59e0b",
    bgLight: "#fffbeb",
    bgLightTo: "#fef3c7",
  },
  {
    icon: "💻",
    label: "Electronics",
    somali: "Qalabka Elektarooniga",
    count: "200+",
    badge: "Hot 🔥",
    badgeColor: "bg-purple-500",
    from: "#8b5cf6",
    bgLight: "#f5f3ff",
    bgLightTo: "#ede9fe",
  },
  {
    icon: "🎒",
    label: "Backpacks",
    somali: "Baakoodhyada",
    count: "50+",
    badge: "Popular",
    badgeColor: "bg-emerald-500",
    from: "#10b981",
    bgLight: "#ecfdf5",
    bgLightTo: "#d1fae5",
  },
  {
    icon: "📓",
    label: "Notebooks",
    somali: "Buugaag Qoraal",
    count: "300+",
    badge: "Value",
    badgeColor: "bg-rose-500",
    from: "#f43f5e",
    bgLight: "#fff1f2",
    bgLightTo: "#ffe4e6",
  },
  {
    icon: "🖊️",
    label: "Pens & Pencils",
    somali: "Qalin & Shareero",
    count: "100+",
    badge: "",
    badgeColor: "bg-teal-500",
    from: "#14b8a6",
    bgLight: "#f0fdfa",
    bgLightTo: "#ccfbf1",
  },
];

/* ─── Animated counter ───────────────────────────────────────────────── */
function useCounter(target: number, duration = 2000, active = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    let startTs: number | null = null;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return count;
}

/* ─── Props ──────────────────────────────────────────────────────────── */
interface HeroSectionProps {
  onShopNowClick: () => void;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const HeroSection = memo(
  ({ onShopNowClick, onAddToCart, onQuickView }: HeroSectionProps) => {
    const [tickerIdx, setTickerIdx] = useState(0);
    const [tickerKey, setTickerKey] = useState(0);
    const [entered, setEntered] = useState(false);
    const statsRef = useRef<HTMLDivElement>(null);
    const [statsVisible, setStatsVisible] = useState(false);

    /* mount entrance */
    useEffect(() => {
      const t = setTimeout(() => setEntered(true), 80);
      return () => clearTimeout(t);
    }, []);

    /* ticker rotation */
    useEffect(() => {
      const id = setInterval(() => {
        setTickerIdx((p) => (p + 1) % TICKERS.length);
        setTickerKey((p) => p + 1);
      }, 3800);
      return () => clearInterval(id);
    }, []);

    /* stats counter trigger on scroll */
    useEffect(() => {
      const el = statsRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const bookCount = useCounter(10000, 2200, statsVisible);
    const studentCount = useCounter(5000, 2000, statsVisible);

    const handleShopNow = useCallback(() => onShopNowClick(), [onShopNowClick]);
    const scrollToDeals = useCallback(() => {
      document
        .getElementById("products-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, []);

    return (
      <>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ANNOUNCEMENT BAR
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white py-2.5 z-40">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmerSlide 3s linear infinite",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 flex items-center gap-3">
            <span className="flex-shrink-0 bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full tracking-wide">
              🔥 DEALS
            </span>
            <div className="overflow-hidden flex-1 h-5 flex items-center">
              <p
                key={tickerKey}
                className="text-sm font-semibold whitespace-nowrap animate-ticker"
              >
                {TICKERS[tickerIdx]}
              </p>
            </div>
            <a
              href="tel:+254722979547"
              className="hidden sm:flex flex-shrink-0 items-center gap-1.5 text-xs text-amber-100 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3" />
              <span>+254 722 979 547</span>
            </a>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            CINEMATIC DARK HERO
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          className="relative min-h-screen overflow-hidden flex items-center"
          style={{
            background:
              "linear-gradient(145deg,#0a0a0a 0%,#140c00 45%,#1e1200 100%)",
          }}
        >
          {/* Ambient glow blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.12]"
              style={{
                background:
                  "radial-gradient(circle,#f59e0b 0%,transparent 70%)",
                animation: "heroFloat 9s ease-in-out infinite",
              }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.08]"
              style={{
                background:
                  "radial-gradient(circle,#f97316 0%,transparent 70%)",
                animation: "heroFloat 12s ease-in-out infinite reverse",
              }}
            />
            <div
              className="absolute -top-20 right-0 w-[350px] h-[350px] rounded-full opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(circle,#fbbf24 0%,transparent 70%)",
                animation: "heroFloat 7s ease-in-out infinite 3s",
              }}
            />
          </div>

          {/* Dot-grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle,#f59e0b 1px,transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* ── LEFT: Text column ── */}
              <div
                className="space-y-8"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "none" : "translateY(32px)",
                  transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
                }}
              >
                {/* eyebrow */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/25 rounded-full">
                  <BadgeCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300 text-sm font-semibold tracking-wide">
                    Hassan Bookshop — Eastleigh, Nairobi
                  </span>
                </div>

                {/* headline */}
                <div>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.92] tracking-tight">
                    <span className="block text-white">Everything</span>
                    <span className="block shimmer-text">You Need</span>
                    <span className="block text-white/90">to Succeed.</span>
                  </h1>
                </div>

                {/* body */}
                <p className="text-slate-300 text-lg leading-relaxed max-w-xl">
                  From{" "}
                  <span className="text-amber-400 font-semibold">
                    KCSE textbooks
                  </span>{" "}
                  to the latest electronics — Nairobi's most trusted educational
                  store, serving students since 2010.
                  <span className="block mt-2 text-amber-400/70 text-base font-somali font-normal">
                    Wax walba oo aad u baahantahay waxbarashadaada
                  </span>
                </p>

                {/* social proof */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex -space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <span className="text-white font-bold">5.0</span>
                  <span className="text-slate-400 text-sm">
                    · 5,000+ happy students
                  </span>
                  <span className="hidden sm:inline text-slate-600">|</span>
                  <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Open Now
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleShopNow}
                    className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-amber-500/25 hover:shadow-amber-500/45 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-3"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Shop Now</span>
                    <span className="text-amber-200 text-sm font-somali font-normal">
                      · Bilow
                    </span>
                  </button>

                  <button
                    onClick={scrollToDeals}
                    className="group border-2 border-amber-500/35 text-amber-300 hover:border-amber-400 hover:text-white hover:bg-amber-500/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2.5"
                  >
                    <Flame className="w-5 h-5 text-orange-400 group-hover:scale-125 transition-transform duration-300" />
                    Today's Deals
                  </button>
                </div>

                {/* contact strip */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-white/8">
                  <a
                    href="tel:+254722979547"
                    className="flex items-center gap-2 text-slate-400 hover:text-amber-400 transition-colors text-sm"
                  >
                    <Phone className="w-4 h-4 text-amber-500" />
                    +254 722 979 547
                  </a>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    Juja B Tower, Muratina St, Eastleigh
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Category showcase card ── */}
              <div
                className="relative"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "none" : "translateY(32px)",
                  transition:
                    "opacity 0.8s ease-out 0.25s, transform 0.8s ease-out 0.25s",
                }}
              >
                <div className="bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                  {/* card header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white font-black text-xl">
                        Shop by Category
                      </h3>
                      <p className="text-slate-500 text-sm font-somali mt-0.5">
                        Xulo Nooca Alaabta
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      In Stock
                    </span>
                  </div>

                  {/* category grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((cat, i) => (
                      <button
                        key={cat.label}
                        onClick={handleShopNow}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 rounded-2xl p-3.5 text-center transition-all duration-300 hover:scale-105"
                        style={{
                          opacity: entered ? 1 : 0,
                          transform: entered ? "none" : "scale(0.9)",
                          transition: `opacity 0.5s ease-out ${
                            0.4 + i * 0.07
                          }s, transform 0.5s ease-out ${0.4 + i * 0.07}s`,
                        }}
                      >
                        {cat.badge && (
                          <span
                            className={`absolute -top-2 -right-2 ${cat.badgeColor} text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap`}
                          >
                            {cat.badge}
                          </span>
                        )}
                        <div className="text-2xl mb-1.5 group-hover:scale-110 transition-transform duration-300">
                          {cat.icon}
                        </div>
                        <div className="text-white text-xs font-bold">
                          {cat.label}
                        </div>
                        <div
                          className="text-[10px] mt-0.5 font-medium"
                          style={{ color: cat.from }}
                        >
                          {cat.count} items
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* delivery strip */}
                  <div className="mt-5 p-3.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <p className="text-white text-xs font-bold">
                          Free delivery over KES 2,000
                        </p>
                        <p className="text-amber-400/70 text-[10px] font-somali">
                          Gaadiid Bilaash Nairobi
                        </p>
                      </div>
                    </div>
                    <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 animate-hero-pulse" />
                  </div>
                </div>

                {/* Floating accent badges */}
                <div
                  className="absolute -top-5 -left-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center gap-2"
                  style={{ animation: "heroFloat 5s ease-in-out infinite" }}
                >
                  <BadgeCheck className="w-4 h-4" />
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      Trusted Store
                    </div>
                    <div className="text-[9px] opacity-80">Since 2010</div>
                  </div>
                </div>

                <div
                  className="absolute -bottom-5 -right-5 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-rose-500/30 flex items-center gap-1.5"
                  style={{
                    animation: "heroFloat 6s ease-in-out infinite 1.2s",
                  }}
                >
                  <Gift className="w-4 h-4" />
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      Deals Every Day
                    </div>
                    <div className="text-[9px] opacity-80 font-somali">
                      Qiimo Wanaagsan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div
              ref={statsRef}
              className="mt-20 grid grid-cols-3 gap-4 sm:gap-6"
            >
              {[
                {
                  value: `${bookCount.toLocaleString()}+`,
                  label: "Books Available",
                  sub: "Buugaag Diyaar",
                  color: "#f59e0b",
                },
                {
                  value: `${studentCount.toLocaleString()}+`,
                  label: "Happy Students",
                  sub: "Ardayda Farxada",
                  color: "#10b981",
                },
                {
                  value: "24/7",
                  label: "Customer Support",
                  sub: "Taageero",
                  color: "#60a5fa",
                },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center p-4 sm:p-6 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-amber-500/30 transition-all duration-300"
                  style={{
                    opacity: statsVisible ? 1 : 0,
                    transform: statsVisible ? "none" : "translateY(20px)",
                    transition: `opacity 0.6s ease-out ${
                      i * 0.15
                    }s, transform 0.6s ease-out ${i * 0.15}s`,
                  }}
                >
                  <div
                    className="text-2xl sm:text-4xl font-black mb-2"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-white text-xs sm:text-sm font-semibold">
                    {stat.label}
                  </div>
                  <div className="text-slate-500 text-[10px] sm:text-xs font-somali mt-0.5">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* scroll cue */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-600"
            style={{ animation: "heroPulse 2.5s ease-in-out infinite" }}
          >
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <ChevronDown className="w-5 h-5" />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            VISUAL CATEGORY SHOWCASE
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="bg-white dark:bg-slate-900 py-16 sm:py-20 border-b border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-amber-600 dark:text-amber-400 font-bold text-xs tracking-widest uppercase mb-2">
                  ✦ Browse by Category
                </p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                  What are you
                  <br />
                  looking for?
                </h2>
              </div>
              <button
                onClick={handleShopNow}
                className="flex-shrink-0 text-amber-600 dark:text-amber-400 font-bold text-sm hover:text-amber-700 transition-colors"
              >
                View All Products →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={handleShopNow}
                  className="group relative rounded-3xl p-4 sm:p-5 text-center border-2 border-transparent hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(135deg,${cat.bgLight},${cat.bgLightTo})`,
                  }}
                >
                  {/* dark mode overlay */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 dark:opacity-100 pointer-events-none"
                    style={{ background: "rgba(15,23,42,0.85)" }}
                  />
                  {cat.badge && (
                    <span
                      className={`absolute z-10 -top-2 -right-2 ${cat.badgeColor} text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg`}
                    >
                      {cat.badge}
                    </span>
                  )}
                  <div className="relative z-10 text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <div className="relative z-10 font-black text-slate-900 dark:text-white text-sm">
                    {cat.label}
                  </div>
                  <div
                    className="relative z-10 text-xs font-somali font-medium mt-0.5"
                    style={{ color: cat.from }}
                  >
                    {cat.somali}
                  </div>
                  <div className="relative z-10 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {cat.count} items
                  </div>
                  {/* hover ring glow */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `0 0 0 2px ${cat.from}60` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TRUST / VALUE BAR
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="bg-slate-900 dark:bg-slate-950 py-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: <Truck className="w-6 h-6" />,
                  title: "Same Day Delivery",
                  sub: "Free on orders over KES 2,000 within Nairobi",
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "100% Genuine Products",
                  sub: "Quality guaranteed or full money back",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  icon: <Star className="w-6 h-6 fill-current" />,
                  title: "Nairobi's Best Prices",
                  sub: "Price match on all items. No hidden charges",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-4 group">
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{item.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            FEATURED PRODUCTS
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div
          id="products-section"
          className="bg-gradient-to-br from-stone-50 to-amber-50 dark:from-slate-900 dark:to-slate-800"
        >
          <div className="mt-8 sm:mt-16 lg:mt-20">
            <FeaturedProducts
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          </div>
        </div>
      </>
    );
  },
);

HeroSection.displayName = "HeroSection";
export default HeroSection;
