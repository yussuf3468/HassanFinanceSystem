import { ArrowRight, Package, TruckIcon, ShieldCheck } from "lucide-react";
import Button from "./Button";
import Container from "./Container";

interface HeroProps {
  onShopNow?: () => void;
  onTrackOrder?: () => void;
}

export default function Hero({ onShopNow, onTrackOrder }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-amber-900 to-slate-800 dark:from-slate-950 dark:via-amber-950 dark:to-slate-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <Container className="relative z-10 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-white space-y-6 lg:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Premium Quality Guaranteed</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight">
                <span className="block mb-2">Horumar</span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-medium text-yellow-50">
                  Your business. Your progress.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-yellow-50 max-w-2xl">
                Premium educational materials, stationery, and electronics.
                Quality products for students and professionals in Eastleigh,
                Nairobi.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onShopNow}
                variant="secondary"
                size="lg"
                className="group"
              >
                <Package className="w-5 h-5" />
                Shop Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={onTrackOrder}
                variant="outline"
                size="lg"
                className="!bg-white/10 !backdrop-blur-md !border-white/30 !text-white hover:!bg-white/20"
              >
                <TruckIcon className="w-5 h-5" />
                Track Order
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-white/20">
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300">
                  5000+
                </div>
                <div className="text-sm sm:text-base text-yellow-50 mt-1">
                  Products
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300">
                  10k+
                </div>
                <div className="text-sm sm:text-base text-yellow-50 mt-1">
                  Customers
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-300">
                  24/7
                </div>
                <div className="text-sm sm:text-base text-yellow-50 mt-1">
                  Support
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-600/20" />
              <img
                src="/hero-products.jpg"
                alt="Horumar Products"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop";
                }}
              />
            </div>

            {/* Floating Cards */}
            <div className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Quality Assured
                  </div>
                  <div className="text-xs text-slate-500">100% Authentic</div>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-8 bottom-8 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 animate-bounce-slow delay-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                  <TruckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Fast Delivery
                  </div>
                  <div className="text-xs text-slate-500">
                    Same day in Eastleigh
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-12 sm:h-16 lg:h-24 fill-slate-50 dark:fill-slate-900"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
    </section>
  );
}
