import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from "react";
import {
  ShoppingCart,
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  Phone,
  MapPin,
  Clock,
  ChevronDown,
  X,
  SlidersHorizontal,
  Heart,
  Plus,
} from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getPublishedProductsInStock } from "../api";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useDebounceValue } from "../hooks/usePerformance";
import Navbar from "./Navbar";
import CartSidebar from "./CartSidebar";
import AuthModal from "./AuthModal";
import ProductQuickView from "./ProductQuickView";
import CheckoutModal from "./CheckoutModal";
import OptimizedImage from "./OptimizedImage";
import compactToast from "../utils/compactToast";
import type { Product } from "../types";

interface CustomerStoreProps {
  onCheckout?: () => void;
  onAdminClick?: () => void;
}

type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "name", label: "Name (A–Z)" },
];

const PAGE_SIZE = 12;
const FREE_DELIVERY_THRESHOLD = 2000;

// Hardcoded category image (used when no product in that category has an image_url)
function getCategoryImage(category: string): { image: string } {
  const c = category.toLowerCase();
  if (c.includes("book") && !c.includes("note"))
    return {
      image:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("note"))
    return {
      image:
        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("electron") || c.includes("gadget") || c.includes("tech"))
    return {
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("pen") || c.includes("pencil") || c.includes("station"))
    return {
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("bag") || c.includes("pack"))
    return {
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("calc") || c.includes("math"))
    return {
      image:
        "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("art") || c.includes("paint") || c.includes("color"))
    return {
      image:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80&auto=format&fit=crop",
    };
  if (c.includes("school") || c.includes("study"))
    return {
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&auto=format&fit=crop",
    };
  return {
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80&auto=format&fit=crop",
  };
}

// ============================================================
// PRODUCT CARD (clean, no fake stars/SALE)
// ============================================================

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  priority?: boolean;
}

const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  priority,
}: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOut = product.quantity_in_stock <= 0;
  const isLow =
    !isOut && product.quantity_in_stock <= (product.reorder_level || 5);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOut || adding) return;
    setAdding(true);
    onAddToCart(product);
    setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }, 180);
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    setLiked((v) => !v);
    if (!liked) compactToast.addToWishlist();
  }

  return (
    <div
      data-product-id={product.id}
      onClick={() => onQuickView(product)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col cursor-pointer transition-all hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-500/5 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          fallbackClassName="w-full h-full"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Wishlist heart */}
        <button
          type="button"
          onClick={handleLike}
          aria-label="Save to wishlist"
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all ${
            liked
              ? "bg-rose-500 text-white scale-110"
              : "bg-white/90 dark:bg-slate-900/80 text-slate-500 hover:text-rose-500"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.featured && !isOut && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              Featured
            </span>
          )}
          {isLow && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
              Limited
            </span>
          )}
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white/95 text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 sm:p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">
          {product.category}
        </p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2 leading-tight min-h-[2.5em]">
          {product.name}
        </h3>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            KES
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {product.selling_price.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isOut || adding}
          className={`mt-2.5 h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
            isOut
              ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
              : added
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-sm"
          }`}
        >
          {added ? (
            <>
              <span className="text-sm">✓</span> Added
            </>
          ) : adding ? (
            <>
              <ShoppingCart className="w-4 h-4 animate-pulse" /> Adding…
            </>
          ) : isOut ? (
            "Unavailable"
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add to cart
            </>
          )}
        </button>
      </div>
    </div>
  );
});

// ============================================================
// FILTER SHEET (mobile)
// ============================================================

interface FilterSheetProps {
  isOpen: boolean;
  categories: string[];
  selected: string;
  onSelect: (c: string) => void;
  onClose: () => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;
}

function FilterSheet({
  isOpen,
  categories,
  selected,
  onSelect,
  onClose,
  sort,
  onSortChange,
}: FilterSheetProps) {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm sm:hidden"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl sm:hidden max-h-[85vh] flex flex-col">
        <div className="px-5 pt-4 pb-2 relative">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Filters
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Sort by
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onSortChange(opt.key)}
                  className={`px-4 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors ${
                    sort === opt.key
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Category
            </p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onSelect(c);
                    onClose();
                  }}
                  className={`px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    selected === c
                      ? "bg-amber-500 text-white shadow"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {c === "all" ? "All Products" : c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================
// MAIN STOREFRONT
// ============================================================

export default function CustomerStore({
  onCheckout,
  onAdminClick,
}: CustomerStoreProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounceValue(searchTerm, 250);
  const cart = useCart();
  const { user } = useAuth();
  const productsTopRef = useRef<HTMLDivElement | null>(null);

  // Load products
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPublishedProductsInStock();
        setProducts(data || []);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Categories derived from data (fallback to a known list)
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = products;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        break;
      case "price-asc":
        sorted.sort((a, b) => a.selling_price - b.selling_price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.selling_price - a.selling_price);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        sorted.sort((a, b) => {
          const af = a.featured ? 1 : 0;
          const bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          return a.name.localeCompare(b.name);
        });
    }
    return sorted;
  }, [products, debouncedSearch, selectedCategory, sort]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  const hasMore = visibleCount < filtered.length;

  // Reset visible count when filter/search/sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearch, selectedCategory, sort]);

  // Cart helpers
  const handleAddToCart = useCallback(
    (product: Product) => {
      cart.addItem(product);
      compactToast.addToCart(product.name);
    },
    [cart],
  );

  const handleSearch = useCallback((v: string) => {
    setSearchTerm(v);
    if (v.trim()) {
      productsTopRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  function scrollToProducts() {
    productsTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Featured tiles (4 most-popular categories)
  const featuredCategories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      counts.set(p.category, (counts.get(p.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => ({ category, count }));
  }, [products]);

  // Free-delivery progress (cart-aware)
  const freeDeliveryProgress = Math.min(
    1,
    cart.totalPrice / FREE_DELIVERY_THRESHOLD,
  );
  const amountToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - cart.totalPrice);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Navbar */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onCartClick={() => setShowCart(true)}
        onAuthClick={() => setShowAuth(true)}
        onAdminClick={user ? onAdminClick : undefined}
        products={products}
        onProductSelect={() => {}}
      />

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-amber-100 dark:border-slate-800">
        <div
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(245 158 11 / 0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-16">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
            {/* Hero text */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-full px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Trusted in Eastleigh since 2010
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                Everything for school,
                <span className="block text-amber-600 dark:text-amber-400">
                  delivered to your door.
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
                Books, stationery, electronics & backpacks. Order online or call
                — we'll get it to you fast across Nairobi.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={scrollToProducts}
                  className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/30 flex items-center gap-2 active:scale-95 transition-transform"
                >
                  Shop products
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="tel:+254722979547"
                  className="h-12 px-5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded-xl flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call to order
                </a>
              </div>

              {/* Value props */}
              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
                {[
                  { icon: Truck, label: "Fast delivery", sub: "Across Nairobi" },
                  { icon: ShieldCheck, label: "Verified", sub: "Genuine items" },
                  { icon: Clock, label: "Open daily", sub: "8am – 11pm" },
                ].map((v) => (
                  <div
                    key={v.label}
                    className="bg-white/70 dark:bg-slate-800/60 backdrop-blur rounded-xl p-2.5 border border-amber-100 dark:border-slate-700"
                  >
                    <v.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white mt-1 leading-tight">
                      {v.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {v.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category tiles (right side / below on mobile) */}
            {featuredCategories.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {featuredCategories.map((cat) => {
                  const imageSrc = getCategoryImage(cat.category).image;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.category);
                        scrollToProducts();
                      }}
                      className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm hover:shadow-xl transition-all active:scale-95"
                    >
                      <img
                        src={imageSrc}
                        alt={cat.category}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallback !== "1") {
                            img.dataset.fallback = "1";
                            img.src = getCategoryImage("other").image;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                        <p className="text-white font-black text-sm sm:text-base leading-tight truncate drop-shadow">
                          {cat.category}
                        </p>
                        <p className="text-amber-200 text-[11px] font-semibold drop-shadow">
                          {cat.count} item{cat.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== STICKY FILTER STRIP ===================== */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="sm:hidden flex-shrink-0 h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {selectedCategory !== "all" && (
              <span className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>

          {/* Desktop category pills */}
          <div className="hidden sm:flex flex-1 min-w-0 gap-1.5 overflow-x-auto scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`flex-shrink-0 h-9 px-3.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? "bg-amber-500 text-white shadow"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative ml-auto sm:ml-2">
            <details className="group">
              <summary className="list-none h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-transform">
                <span className="hidden sm:inline">Sort:</span>
                <span className="truncate max-w-[110px]">
                  {SORT_OPTIONS.find((s) => s.key === sort)?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-40">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={(e) => {
                      setSort(opt.key);
                      // Close <details>
                      const parent = e.currentTarget.closest(
                        "details",
                      ) as HTMLDetailsElement | null;
                      if (parent) parent.open = false;
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      sort === opt.key
                        ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* ===================== PRODUCT GRID ===================== */}
      <main
        ref={productsTopRef}
        className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-32 lg:pb-12"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <span className="font-black text-slate-900 dark:text-white">
              {filtered.length}
            </span>{" "}
            products
            {selectedCategory !== "all" && (
              <span className="text-amber-600 dark:text-amber-400 ml-1 font-semibold">
                · {selectedCategory}
              </span>
            )}
            {debouncedSearch && (
              <span className="text-slate-500 ml-1">for "{debouncedSearch}"</span>
            )}
          </p>
          {(selectedCategory !== "all" || debouncedSearch) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchTerm("");
              }}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-slate-200 dark:bg-slate-800" />
                <div className="p-3 space-y-2">
                  <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No products found
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Try a different search or clear your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchTerm("");
              }}
              className="mt-4 h-11 px-6 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              id="products-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                  onQuickView={(prod) => setQuickViewProduct(prod)}
                  priority={i < 4}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
                  }
                  className="h-12 px-7 bg-white dark:bg-slate-900 border-2 border-amber-500 text-amber-700 dark:text-amber-300 text-sm font-black rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  Load more
                  <span className="text-[11px] font-bold text-slate-500">
                    ({filtered.length - visibleCount} left)
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ===================== FOOTER ===================== */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 border-t border-slate-800">
        {/* CTA strip */}
        <div className="bg-amber-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-white font-black text-lg sm:text-xl">
                Need help with an order?
              </h3>
              <p className="text-amber-50 text-sm">
                Talk to our team — we reply within minutes.
              </p>
            </div>
            <a
              href="tel:+254722979547"
              className="bg-white text-amber-700 font-black px-6 h-12 rounded-xl hover:bg-amber-50 transition-colors flex items-center gap-2 shadow"
            >
              <Phone className="w-4 h-4" />
              +254 722 979 547
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="col-span-2">
            <h3 className="text-amber-400 font-black text-lg">Hassan Bookshop</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
              Your trusted partner for books, stationery, and electronics in
              Eastleigh, Nairobi. Serving students and professionals since 2010.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:+254722979547"
                  className="hover:text-amber-400 flex items-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  +254 722 979 547
                </a>
              </li>
              <li>
                <a
                  href="mailto:yussufh080@gmail.com"
                  className="hover:text-amber-400 break-all"
                >
                  yussufh080@gmail.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3 text-sm">Visit</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Global Apartments,
                  <br />
                  Eastleigh Section 1, Nairobi
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Mon–Sat: 8am – 8pm
                  <br />
                  Sun: 9am – 6pm
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Hassan Bookshop. All rights reserved.</p>
          <a
            href="https://lenzro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-500 hover:text-amber-400 font-semibold"
          >
            Powered by Lenzro
          </a>
        </div>
      </footer>

      {/* ===================== MOBILE FLOATING CART BAR ===================== */}
      {cart.totalItems > 0 && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Free delivery progress */}
            <div className="px-4 pt-2.5 pb-1.5 bg-slate-800/60">
              {amountToFree > 0 ? (
                <p className="text-[11px] font-medium text-amber-200">
                  Add{" "}
                  <span className="font-black text-white">
                    KES {amountToFree.toLocaleString()}
                  </span>{" "}
                  more for{" "}
                  <span className="font-black text-emerald-400">
                    free delivery
                  </span>
                </p>
              ) : (
                <p className="text-[11px] font-bold text-emerald-400">
                  ✓ You qualify for free delivery!
                </p>
              )}
              <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${freeDeliveryProgress * 100}%` }}
                />
              </div>
            </div>

            {/* CTA row */}
            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 active:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-amber-600 text-[11px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                    {cart.totalItems}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-medium text-slate-300 leading-tight">
                    {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
                  </p>
                  <p className="text-base font-black leading-tight">
                    KES {cart.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-amber-300">
                View cart
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ===================== MODALS / DRAWERS ===================== */}
      <CartSidebar
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false);
          setShowCheckout(true);
        }}
      />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onOrderComplete={(order) => {
          compactToast.orderSuccess(order.order_number);
          onCheckout?.();
        }}
      />
      <ProductQuickView
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />
      <FilterSheet
        isOpen={showFilters}
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        onClose={() => setShowFilters(false)}
        sort={sort}
        onSortChange={(s) => setSort(s)}
      />

      <ToastContainer
        position="bottom-center"
        autoClose={2200}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme="light"
        className="!z-50 !mb-24 lg:!mb-0"
        toastClassName="!rounded-xl !shadow-lg !min-h-12 !text-sm !p-3"
      />
    </div>
  );
}
