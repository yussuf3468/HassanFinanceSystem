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
  MapPin,
  Clock,
  ChevronDown,
  X,
  SlidersHorizontal,
  Heart,
  Check,
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
      className="group relative bg-white dark:bg-[#1d1d1f] rounded-3xl overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#f5f5f7] dark:bg-[#2c2c2e] overflow-hidden">
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          fallbackClassName="w-full h-full"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Wishlist heart */}
        <button
          type="button"
          onClick={handleLike}
          aria-label="Save to wishlist"
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all ${
            liked
              ? "bg-rose-500/95 text-white"
              : "bg-white/70 dark:bg-black/40 text-[#1d1d1f] dark:text-white opacity-0 group-hover:opacity-100"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && !isOut && (
            <span className="bg-white/90 dark:bg-black/60 backdrop-blur-xl text-[#1d1d1f] dark:text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
              Featured
            </span>
          )}
          {isLow && (
            <span className="bg-[#1d1d1f]/90 backdrop-blur-xl text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
              Limited
            </span>
          )}
        </div>

        {isOut && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md flex items-center justify-center">
            <span className="text-[#1d1d1f] dark:text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white dark:bg-black/80 shadow-sm">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#6e6e73] dark:text-[#86868b] truncate">
          {product.category}
        </p>
        <h3 className="text-base sm:text-[17px] font-semibold text-[#1d1d1f] dark:text-white mt-1 line-clamp-2 leading-snug tracking-tight min-h-[2.6em]">
          {product.name}
        </h3>

        <div className="mt-2.5 text-sm text-[#1d1d1f] dark:text-white">
          From{" "}
          <span className="font-semibold tabular-nums">
            KES {product.selling_price.toLocaleString()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isOut || adding}
          className={`mt-4 h-10 rounded-full font-medium text-sm flex items-center justify-center gap-1.5 transition-all ${
            isOut
              ? "bg-[#f5f5f7] text-[#86868b] dark:bg-[#2c2c2e] dark:text-[#6e6e73] cursor-not-allowed"
              : added
                ? "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]"
                : "bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f]"
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" /> Added
            </>
          ) : adding ? (
            <>
              <ShoppingCart className="w-4 h-4 animate-pulse" /> Adding…
            </>
          ) : isOut ? (
            "Unavailable"
          ) : (
            "Add to Bag"
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

  // Featured product rail — prefer flagged featured, fall back to in-stock items
  const featuredProducts = useMemo(() => {
    const inStock = products.filter((p) => p.quantity_in_stock > 0);
    const flagged = inStock.filter((p) => p.featured);
    const pool = flagged.length >= 4 ? flagged : inStock;
    return pool.slice(0, 10);
  }, [products]);

  // Free-delivery progress (cart-aware)
  const freeDeliveryProgress = Math.min(
    1,
    cart.totalPrice / FREE_DELIVERY_THRESHOLD,
  );
  const amountToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - cart.totalPrice);

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] antialiased">
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

      {/* ===================== HERO (editorial, high-class) ===================== */}
      <section className="bg-white dark:bg-black">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-24 lg:pt-28 pb-10 sm:pb-16 text-center">
          <p className="text-[12px] sm:text-[13px] uppercase tracking-[0.25em] text-[#86868b] dark:text-[#a1a1a6] font-medium mb-4">
            Hassan Bookshop · Eastleigh, Nairobi
          </p>
          <h1 className="text-[44px] sm:text-[68px] lg:text-[84px] leading-[1.02] font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-white">
            Everything for school.
          </h1>
          <h2 className="text-[44px] sm:text-[68px] lg:text-[84px] leading-[1.02] font-semibold tracking-[-0.03em] text-[#b0b0b5] dark:text-[#5e5e63]">
            Delivered, fast.
          </h2>
          <p className="mt-5 max-w-lg mx-auto text-[16px] sm:text-[19px] leading-relaxed text-[#6e6e73] dark:text-[#a1a1a6]">
            Books, stationery, electronics, and backpacks — sourced with care
            and delivered across Nairobi.
          </p>
          <div className="mt-7 flex items-center justify-center gap-6 flex-wrap">
            <button
              type="button"
              onClick={scrollToProducts}
              className="h-12 px-8 bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
            >
              Shop the collection
            </button>
            <a
              href="tel:+254722979547"
              className="text-[#1d1d1f] dark:text-white text-[15px] font-medium inline-flex items-center gap-1.5 group"
            >
              Call to order
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Trust line */}
          <div className="mt-7 flex items-center justify-center gap-5 flex-wrap text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[#f5a623] tracking-tight">★★★★★</span>
              <span className="font-medium">Loved by 2,000+ students</span>
            </span>
            <span className="hidden sm:inline text-[#d2d2d7] dark:text-[#48484a]">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="w-4 h-4" />
              Same-day delivery in Nairobi
            </span>
          </div>
        </div>

        {/* ===== Featured product rail (horizontal scroll) ===== */}
        {featuredProducts.length > 0 && (
          <div className="pb-14 sm:pb-20">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-end justify-between mb-5">
              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-[#86868b] dark:text-[#a1a1a6] font-medium">
                  Picked for you
                </p>
                <h3 className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mt-1">
                  Featured this week.
                </h3>
              </div>
              <button
                type="button"
                onClick={scrollToProducts}
                className="hidden sm:inline-flex items-center gap-1 text-[14px] font-medium text-[#1d1d1f] dark:text-white group whitespace-nowrap"
              >
                See all
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2 snap-x snap-mandatory">
              {featuredProducts.map((p) => {
                const out = p.quantity_in_stock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setQuickViewProduct(p)}
                    className="group snap-start flex-shrink-0 w-[150px] sm:w-[200px] text-left"
                  >
                    <div className="relative aspect-square bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#c7c7cc] dark:text-[#48484a] text-3xl">
                          📦
                        </div>
                      )}
                      {p.featured && !out && (
                        <span className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 backdrop-blur-xl text-[#1d1d1f] dark:text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 -rotate-45" />
                      </span>
                    </div>
                    <p className="mt-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#86868b] dark:text-[#a1a1a6] truncate">
                      {p.category}
                    </p>
                    <h4 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white leading-snug line-clamp-2 mt-0.5">
                      {p.name}
                    </h4>
                    <p className="text-[14px] text-[#1d1d1f] dark:text-white mt-1 tabular-nums">
                      KES {p.selling_price.toLocaleString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Featured category strip — Apple "Browse by" style ===== */}
        {featuredCategories.length > 0 && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
            <h3 className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-6">
              Browse by category.
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    className="group relative aspect-[4/5] bg-[#f5f5f7] dark:bg-[#1d1d1f] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.2)]"
                  >
                    <img
                      src={imageSrc}
                      alt={cat.category}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallback !== "1") {
                          img.dataset.fallback = "1";
                          img.src = getCategoryImage("other").image;
                        }
                      }}
                    />
                    <div className="absolute inset-x-0 top-0 p-5 text-left">
                      <p className="text-white text-[20px] sm:text-[24px] font-semibold tracking-tight drop-shadow-md">
                        {cat.category}
                      </p>
                      <p className="text-white/85 text-[13px] font-medium mt-0.5 drop-shadow">
                        {cat.count} item{cat.count !== 1 ? "s" : ""} →
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Promo banner ===== */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-[#1d1d1f] dark:bg-[#1d1d1f] px-6 sm:px-12 py-12 sm:py-16 text-center">
            {/* soft glow accents */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.04] blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/[0.04] blur-3xl" />
            <p className="relative text-[12px] uppercase tracking-[0.2em] text-white/60 font-medium">
              Free delivery
            </p>
            <h3 className="relative mt-2 text-[28px] sm:text-[44px] font-semibold tracking-tight text-white leading-tight">
              Spend KES 2,000, we'll
              <br className="hidden sm:block" /> bring it to your door.
            </h3>
            <p className="relative mt-3 text-[15px] sm:text-[17px] text-white/70 max-w-md mx-auto">
              Order before 3 PM and get it the same day, anywhere in Nairobi.
            </p>
            <button
              type="button"
              onClick={scrollToProducts}
              className="relative mt-7 h-12 px-8 bg-white hover:bg-[#f5f5f7] text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
            >
              Start shopping
            </button>
          </div>
        </div>

        {/* Value props strip */}
        <div className="bg-[#f5f5f7] dark:bg-[#1d1d1f] border-y border-black/5 dark:border-white/5">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-3 gap-6 sm:gap-10">
            {[
              { icon: Truck, label: "Fast delivery", sub: "Across Nairobi" },
              {
                icon: ShieldCheck,
                label: "Genuine items",
                sub: "Verified suppliers",
              },
              { icon: Clock, label: "Open daily", sub: "8am – 11pm" },
            ].map((v) => (
              <div key={v.label} className="text-center sm:text-left">
                <v.icon className="w-5 h-5 text-[#1d1d1f] dark:text-white mx-auto sm:mx-0" />
                <p className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white mt-2 tracking-tight">
                  {v.label}
                </p>
                <p className="text-[13px] text-[#86868b] dark:text-[#a1a1a6]">
                  {v.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== STICKY FILTER STRIP (Apple-style) ===================== */}
      <div className="sticky top-[92px] md:top-12 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="sm:hidden flex-shrink-0 h-9 px-4 rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white text-[13px] font-medium flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {selectedCategory !== "all" && (
              <span className="w-1.5 h-1.5 bg-[#1d1d1f] dark:bg-white rounded-full" />
            )}
          </button>

          {/* Desktop category pills */}
          <div className="hidden sm:flex flex-1 min-w-0 gap-1 overflow-x-auto scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCategory(c)}
                className={`flex-shrink-0 h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === c
                    ? "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f]"
                    : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#1d1d1f]"
                }`}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative ml-auto sm:ml-2">
            <details className="group">
              <summary className="list-none h-9 px-4 rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white text-[13px] font-medium flex items-center gap-1.5 cursor-pointer select-none transition-colors">
                <span className="hidden sm:inline text-[#86868b] dark:text-[#a1a1a6]">
                  Sort by
                </span>
                <span className="truncate max-w-[110px]">
                  {SORT_OPTIONS.find((s) => s.key === sort)?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1d1d1f] rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden z-40 backdrop-blur-xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={(e) => {
                      setSort(opt.key);
                      const parent = e.currentTarget.closest(
                        "details",
                      ) as HTMLDetailsElement | null;
                      if (parent) parent.open = false;
                    }}
                    className={`w-full px-4 py-2.5 text-left text-[13px] transition-colors ${
                      sort === opt.key
                        ? "text-[#1d1d1f] dark:text-white font-medium bg-[#f5f5f7] dark:bg-[#2c2c2e]"
                        : "text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e]"
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

      {/* ===================== PRODUCT GRID (Apple-style) ===================== */}
      <main
        ref={productsTopRef}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 pb-32 lg:pb-20"
      >
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white leading-tight">
              {selectedCategory !== "all" ? selectedCategory : "All products"}.
            </h2>
            <p className="text-[15px] text-[#86868b] dark:text-[#a1a1a6] mt-1">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
              {debouncedSearch && (
                <span> for "{debouncedSearch}"</span>
              )}
            </p>
          </div>
          {(selectedCategory !== "all" || debouncedSearch) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchTerm("");
              }}
              className="text-[13px] font-medium text-[#1d1d1f] dark:text-white underline underline-offset-4 decoration-[#d2d2d7] hover:decoration-[#1d1d1f] dark:hover:decoration-white whitespace-nowrap transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#1d1d1f] rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-[#f5f5f7] dark:bg-[#2c2c2e]" />
                <div className="p-5 space-y-2">
                  <div className="h-2 w-16 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded" />
                  <div className="h-3 w-full bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded" />
                  <div className="h-3 w-2/3 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded" />
                  <div className="h-10 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-white dark:bg-[#1d1d1f] flex items-center justify-center shadow-sm">
              <Search className="w-7 h-7 text-[#86868b]" />
            </div>
            <h3 className="text-[24px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              No products found
            </h3>
            <p className="text-[15px] text-[#86868b] dark:text-[#a1a1a6] mt-2">
              Try a different search or clear your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchTerm("");
              }}
              className="mt-6 h-11 px-6 bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div
              id="products-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
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
              <div className="flex justify-center mt-12">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
                  }
                  className="h-11 px-7 border border-[#1d1d1f] dark:border-white text-[#1d1d1f] dark:text-white text-[15px] font-medium rounded-full hover:bg-[#1d1d1f] hover:text-white dark:hover:bg-white dark:hover:text-[#1d1d1f] transition-colors inline-flex items-center gap-2"
                >
                  Show more
                  <span className="opacity-60">
                    {filtered.length - visibleCount} left
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ===================== FOOTER (Apple-style) ===================== */}
      <footer className="bg-[#f5f5f7] dark:bg-[#000000] text-[#6e6e73] dark:text-[#86868b] border-t border-black/5 dark:border-white/5">
        {/* Help banner */}
        <div className="border-b border-black/5 dark:border-white/5">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <h3 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Need a hand with your order?
            </h3>
            <p className="text-[15px] mt-2">
              Speak with a specialist — we reply within minutes.
            </p>
            <a
              href="tel:+254722979547"
              className="mt-5 inline-flex items-center gap-1.5 text-[#1d1d1f] dark:text-white text-[15px] font-medium group"
            >
              Call +254 722 979 547
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2">
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white">
              Hassan Bookshop
            </h3>
            <p className="text-[12px] mt-2 max-w-sm leading-relaxed">
              Your trusted partner for books, stationery, and electronics in
              Eastleigh, Nairobi. Serving students and professionals.
            </p>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li>
                <a
                  href="tel:+254722979547"
                  className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                >
                  +254 722 979 547
                </a>
              </li>
              <li>
                <a
                  href="mailto:yussufh080@gmail.com"
                  className="hover:text-[#1d1d1f] dark:hover:text-white transition-colors break-all"
                >
                  yussufh080@gmail.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white mb-3">
              Visit
            </h4>
            <ul className="space-y-2 text-[12px]">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                <span>Global Apartments, Eastleigh Section 1, Nairobi</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Clock className="w-3 h-3 mt-1 flex-shrink-0" />
                <span>Mon–Sat 8am–8pm · Sun 9am–6pm</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/5 py-5 px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px]">
          <p>
            Copyright © {new Date().getFullYear()} Hassan Bookshop. All rights
            reserved.
          </p>
          <a
            href="https://lenzro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1d1d1f] dark:text-white hover:underline underline-offset-4 font-medium"
          >
            Powered by Lenzro
          </a>
        </div>
      </footer>

      {/* ===================== MOBILE FLOATING CART BAR (Apple-glassy) ===================== */}
      {cart.totalItems > 0 && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="bg-white/80 dark:bg-[#1d1d1f]/85 backdrop-blur-2xl text-[#1d1d1f] dark:text-white rounded-[22px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] border border-black/5 dark:border-white/10 overflow-hidden">
            {/* Free delivery progress */}
            <div className="px-4 pt-2.5 pb-1.5">
              {amountToFree > 0 ? (
                <p className="text-[11px] font-medium text-[#86868b] dark:text-[#a1a1a6]">
                  Add{" "}
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">
                    KES {amountToFree.toLocaleString()}
                  </span>{" "}
                  more for{" "}
                  <span className="font-semibold text-[#34c759]">
                    free delivery
                  </span>
                </p>
              ) : (
                <p className="text-[11px] font-semibold text-[#34c759]">
                  ✓ You qualify for free delivery
                </p>
              )}
              <div className="mt-1.5 h-[3px] bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#34c759] transition-all duration-500 rounded-full"
                  style={{ width: `${freeDeliveryProgress * 100}%` }}
                />
              </div>
            </div>

            {/* CTA row */}
            <button
              type="button"
              onClick={() => setShowCart(true)}
              className="w-full px-4 py-3 flex items-center justify-between gap-3 active:bg-black/5 dark:active:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-[#1d1d1f] dark:bg-white flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white dark:text-[#1d1d1f]" />
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-white dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1d1d1f]">
                    {cart.totalItems}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] text-[#86868b] dark:text-[#a1a1a6] leading-tight">
                    {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""}
                  </p>
                  <p className="text-base font-semibold leading-tight tabular-nums">
                    KES {cart.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[14px] font-medium text-[#1d1d1f] dark:text-white">
                View bag
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
