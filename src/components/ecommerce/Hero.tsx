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

      <Container className="relative z-10 py-10 sm:py-12 lg:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Fresh arrivals from Hassan Books
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Shop smarter.
                <span className="mt-1 block text-amber-300">
                  Pick today&apos;s highlight.
                </span>
              </h1>
              <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
                Discover top school and office essentials, then order instantly on the
                website for pickup or delivery in Eastleigh.
              </p>
            </div>

            {highlightProduct ? (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md sm:p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="warning" size="sm">
                    Featured
                  </Badge>
                  <span className="text-xs uppercase tracking-wide text-amber-200">
                    {highlightProduct.category}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  {highlightProduct.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-slate-200 sm:text-base">
                  {highlightProduct.description ||
                    "Quality stock selected for students, parents, and professionals."}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl font-black text-amber-300">
                    KES {highlightProduct.selling_price.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-300">
                    {highlightProduct.quantity_in_stock > 0
                      ? `${highlightProduct.quantity_in_stock} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-slate-200">
                  Browse our latest books, stationery, and electronics.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {highlightProduct ? (
                <Button
                  onClick={() => onViewFeatured?.(highlightProduct)}
                  variant="secondary"
                  size="lg"
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
                  size="lg"
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
                size="lg"
                className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20"
              >
                <TruckIcon className="h-5 w-5" />
                Track Order
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-5">
              <div>
                <div className="text-2xl font-black text-amber-300 sm:text-3xl">
                  5000+
                </div>
                <div className="mt-1 text-xs text-slate-300 sm:text-sm">Products</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-300 sm:text-3xl">Fast</div>
                <div className="mt-1 text-xs text-slate-300 sm:text-sm">Delivery</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-300 sm:text-3xl">
                  Direct
                </div>
                <div className="mt-1 text-xs text-slate-300 sm:text-sm">Web Orders</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur-md">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900/40">
                {highlightProduct ? (
                  <OptimizedImage
                    src={highlightProduct.image_url}
                    alt={highlightProduct.name}
                    className="h-full w-full object-contain p-3"
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

              <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                <span>Order directly on the website</span>
                <span className="font-semibold text-amber-300">Secure checkout</span>
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
