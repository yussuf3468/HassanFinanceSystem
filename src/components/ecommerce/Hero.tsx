import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Package,
  ShoppingCart,
  Sparkles,
  TruckIcon,
} from "lucide-react";
import type { Product } from "../../types";
import OptimizedImage from "../OptimizedImage";
import Badge from "./Badge";
import Button from "./Button";
import Container from "./Container";

interface HeroProps {
  featuredProducts?: Product[];
  onShopNow?: () => void;
  onTrackOrder?: () => void;
  onViewFeatured?: (product: Product) => void;
}

export default function Hero({
  featuredProducts = [],
  onShopNow,
  onTrackOrder,
  onViewFeatured,
}: HeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const heroProducts = useMemo(() => featuredProducts.slice(0, 3), [featuredProducts]);
  const highlightProduct = heroProducts[activeIndex] || null;

  useEffect(() => {
    if (heroProducts.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroProducts.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroProducts.length]);

  useEffect(() => {
    if (activeIndex > heroProducts.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, heroProducts.length]);

  const goToPrevious = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex((current) => (current === 0 ? heroProducts.length - 1 : current - 1));
  };

  const goToNext = () => {
    if (heroProducts.length <= 1) return;
    setActiveIndex((current) => (current + 1) % heroProducts.length);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 dark:from-slate-950 dark:via-slate-900 dark:to-black">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -left-16 top-0 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-yellow-400/20 blur-3xl" />
      </div>

      <Container className="relative z-10 py-6 sm:py-10 lg:py-14">
        <div className="grid items-center gap-5 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 sm:space-y-6 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Fresh arrivals from Hassan Books
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Shop smarter.
                <span className="mt-1 block text-amber-300">
                  Pick today&apos;s highlight.
                </span>
              </h1>
              <p className="max-w-2xl text-sm text-slate-200 sm:text-lg">
                Discover top school and office essentials, then order instantly on the
                website for pickup or delivery in Eastleigh.
              </p>
            </div>

            {highlightProduct ? (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:p-5">
                <div
                  className="relative mb-2 cursor-pointer group"
                  onClick={() => onViewFeatured?.(highlightProduct)}
                  tabIndex={0}
                  role="button"
                  aria-label="View featured product details"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onViewFeatured?.(highlightProduct); } }}
                >
                  <div className="overflow-hidden rounded-xl bg-white/20 flex items-center justify-center mb-2">
                    <OptimizedImage
                      src={highlightProduct.image_url}
                      alt={highlightProduct.name}
                      className="object-contain w-32 h-32 sm:w-40 sm:h-40 mx-auto transition-transform duration-300 group-hover:scale-105"
                      fallbackClassName="w-32 h-32 sm:w-40 sm:h-40"
                      sizes="(max-width: 640px) 60vw, 200px"
                      priority
                    />
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="warning" size="sm">
                      Featured
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs uppercase tracking-wide text-amber-200">
                    {highlightProduct.category}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white sm:text-2xl">
                  {highlightProduct.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-xs text-slate-200 sm:text-base">
                  {highlightProduct.description ||
                    "Quality stock selected for students, parents, and professionals."}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xl font-black text-amber-300 sm:text-2xl">
                    KES {highlightProduct.selling_price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-300 sm:text-sm">
                    {highlightProduct.quantity_in_stock > 0
                      ? `${highlightProduct.quantity_in_stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                <p className="text-sm text-slate-200">
                  Browse our latest books, stationery, and electronics.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {highlightProduct ? (
                <Button
                  onClick={() => onViewFeatured?.(highlightProduct)}
                  variant="secondary"
                  size="md"
                  className="group"
                >
                  <ShoppingCart className="h-5 w-5" />
                  View Featured Product
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  onClick={onShopNow}
                  variant="secondary"
                  size="md"
                  className="group"
                >
                  <Package className="h-5 w-5" />
                  Shop Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              )}

              <Button
                onClick={onTrackOrder}
                variant="outline"
                size="md"
                className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
              >
                <TruckIcon className="h-5 w-5" />
                Track Order
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 sm:gap-5 sm:pt-2">
              <div>
                <div className="text-xl font-black text-amber-300 sm:text-3xl">5000+</div>
                <div className="mt-1 text-[11px] text-slate-300 sm:text-sm">Products</div>
              </div>
              <div>
                <div className="text-xl font-black text-amber-300 sm:text-3xl">Fast</div>
                <div className="mt-1 text-[11px] text-slate-300 sm:text-sm">Delivery</div>
              </div>
              <div>
                <div className="text-xl font-black text-amber-300 sm:text-3xl">
                  Direct
                </div>
                <div className="mt-1 text-[11px] text-slate-300 sm:text-sm">
                  Web Orders
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2.5 shadow-2xl shadow-black/40 backdrop-blur-md sm:rounded-3xl sm:p-4">
              <div className="aspect-[5/4] overflow-hidden rounded-xl bg-slate-900/40 sm:aspect-[4/3] sm:rounded-2xl">
                {highlightProduct ? (
                  <OptimizedImage
                    src={highlightProduct.image_url}
                    alt={highlightProduct.name}
                    className="h-full w-full object-contain p-2"
                    fallbackClassName="flex h-full w-full items-center justify-center bg-slate-800"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    priority
                  />
                ) : (
                  <img
                    src="/hero-products.jpg"
                    alt="Hassan Books products"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop";
                    }}
                  />
                )}
              </div>

              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-950/40 px-3 py-2 text-xs text-slate-200 sm:mt-3 sm:px-4 sm:py-3 sm:text-sm">
                <span>Order directly on website</span>
                <span className="font-semibold text-amber-300">Secure</span>
              </div>

              {heroProducts.length > 1 && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={goToPrevious}
                    className="rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    aria-label="Previous featured product"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {heroProducts.map((product, index) => (
                      <button
                        key={product.id}
                        onClick={() => setActiveIndex(index)}
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          activeIndex === index ? "bg-amber-400" : "bg-white/40"
                        }`}
                        aria-label={`Show featured product ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNext}
                    className="rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                    aria-label="Next featured product"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="h-12 w-full fill-slate-50 dark:fill-slate-900 sm:h-14"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
    </section>
  );
}
