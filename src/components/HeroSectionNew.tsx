import { memo, useCallback } from "react";
import { ShoppingBag, Star, Truck, Shield, Phone, MapPin } from "lucide-react";
import FeaturedProducts from "./FeaturedProducts";
import type { Product } from "../types";

interface HeroSectionProps {
  onShopNowClick: () => void;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

const HeroSection = memo(
  ({ onShopNowClick, onAddToCart, onQuickView }: HeroSectionProps) => {
    const handleShopNowClick = useCallback(() => {
      onShopNowClick();
    }, [onShopNowClick]);

    const scrollToProducts = useCallback(() => {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    }, []);

    return (
      <>
        {/* Mobile-First Extraordinary Hero Section */}
        <section className="relative min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50 overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute inset-0">
            {/* Gentle geometric shapes */}
            <div className="absolute top-10 left-4 sm:left-10 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-r from-amber-200/40 to-amber-300/30 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute top-40 right-4 sm:right-20 w-40 h-40 sm:w-64 sm:h-64 bg-gradient-to-r from-amber-300/30 to-stone-300/30 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-20 left-8 sm:left-32 w-36 h-36 sm:w-56 sm:h-56 bg-gradient-to-r from-amber-200/30 to-amber-400/20 rounded-full blur-3xl opacity-30"></div>

            {/* Arabic pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div
                className="w-full h-full bg-repeat"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.4'%3E%3Cpath d='M30 0l15 15-15 15L15 15z'/%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: "60px 60px",
                }}
              ></div>
            </div>
          </div>

          {/* Main Content Container */}
          <div className="relative z-10 min-h-screen flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                {/* Left Column - Content (Mobile First) */}
                <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
                  {/* Trust Badge with Trilingual Support */}
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-amber-300 shadow-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-slate-800">
                      Loved by many students
                    </span>
                    <span className="hidden sm:inline text-sm text-slate-700 font-somali">
                      • Waxaa jecel arday badan
                    </span>
                  </div>

                  {/* Main Heading with Trilingual Touch */}
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
                      <span className="block">HASSAN</span>
                      <span className="block bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">
                        BOOKSHOP
                      </span>
                      <span className="block text-xl sm:text-2xl lg:text-3xl font-normal text-slate-600 mt-2">
                        Educational Store •{" "}
                        <span className="font-somali">Dukaanka Buugaagta</span>
                      </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-700 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                      Your complete educational partner, from books to
                      electronics.
                      <span className="block mt-2 text-sm sm:text-base text-amber-700 font-medium">
                        📚 Books • ✏️ Stationery • 💻 Electronics • 🎒
                        Accessories
                        <span className="text-xs text-slate-600 font-somali block mt-1">
                          Buugaag • Qalabyo qoraal • Elektaroonik • Alaabta
                        </span>
                      </span>
                    </p>
                  </div>

                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <button
                      onClick={handleShopNowClick}
                      className="group relative bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center justify-center space-x-2">
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" />
                        <span>
                          Shop Now •{" "}
                          <span className="font-somali">Bilow Gadashada</span>
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={scrollToProducts}
                      className="group bg-white text-slate-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl hover:bg-amber-50 transition-all duration-300 font-semibold text-base sm:text-lg border-2 border-slate-300 hover:border-amber-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <span className="group-hover:text-amber-700 transition-colors duration-300">
                        Browse Products •{" "}
                        <span className="font-somali">Daawan Alaabta</span>
                      </span>
                    </button>
                  </div>

                  {/* Contact Info - Mobile Friendly */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-700">
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <Phone className="w-4 h-4 text-amber-600" />
                      <span className="font-medium">+254 722 979 547</span>
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span className="text-center">
                      <span className="text-center">Badeeco tayo leh</span>
                    </span>
                  </div>

                  {/* Address with Arabic */}
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-start space-x-2 bg-white text-slate-700 px-4 py-3 rounded-2xl text-sm border border-slate-300 shadow-sm max-w-sm">
                      <MapPin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-somali">
                          Juja B Tower, Muratina Street, Eastleigh, Nairobi
                        </div>
                        <div className="text-xs text-slate-700 mt-1 font-arabic text-accent-lang">
                          شرق لي، القسم الأول، نيروبي
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Product Showcase (Mobile First) */}
                <div className="relative order-1 lg:order-2">
                  {/* Clean Product Showcase Card */}
                  <div className="relative rounded-2xl shadow-2xl overflow-hidden bg-white border border-slate-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 text-center">
                      <h3 className="text-lg font-bold">Featured Categories</h3>
                      <p className="text-sm opacity-90 font-somali">
                        Qeybaha Muhiimka ah
                      </p>
                    </div>

                    {/* Product Grid - Mobile Optimized */}
                    <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4">
                      {/* Textbooks */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-3 sm:p-4 text-center group hover:shadow-lg transition-all duration-300 border border-blue-200 hover:scale-105">
                        <div className="text-2xl sm:text-3xl mb-2">📚</div>
                        <div className="text-sm font-semibold text-slate-900 mb-1">
                          Textbooks
                        </div>
                        <div className="text-xs text-blue-700 font-somali">
                          Buugaag Waxbarasho
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          1000+ Books
                        </div>
                      </div>

                      {/* Stationery */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-3 sm:p-4 text-center group hover:shadow-lg transition-all duration-300 border border-amber-200 hover:scale-105">
                        <div className="text-2xl sm:text-3xl mb-2">✏️</div>
                        <div className="text-sm font-semibold text-slate-900 mb-1">
                          Stationery
                        </div>
                        <div className="text-xs text-amber-700 font-somali">
                          Alaabta Qoraalka
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          500+ Items
                        </div>
                      </div>

                      {/* Electronics */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-3 sm:p-4 text-center group hover:shadow-lg transition-all duration-300 border border-orange-200 hover:scale-105">
                        <div className="text-2xl sm:text-3xl mb-2">💻</div>
                        <div className="text-sm font-semibold text-slate-900 mb-1">
                          Electronics
                        </div>
                        <div className="text-xs text-orange-700 font-somali">
                          Qalabka Elektarooniga
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          200+ Devices
                        </div>
                      </div>

                      {/* Accessories */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-3 sm:p-4 text-center group hover:shadow-lg transition-all duration-300 border border-emerald-200 hover:scale-105">
                        <div className="text-2xl sm:text-3xl mb-2">🎒</div>
                        <div className="text-sm font-semibold text-slate-900 mb-1">
                          Accessories
                        </div>
                        <div className="text-xs text-emerald-700 font-somali">
                          Alaabta Dheeriga
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          300+ Items
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="bg-gradient-to-r from-amber-50 to-white p-4 border-t border-slate-200">
                      <div className="text-center">
                        <div className="text-sm font-medium text-slate-900 mb-1">
                          Special Offer
                        </div>
                        <div className="text-xs text-amber-700 font-somali">
                          Bixinta Gaarka ah
                        </div>
                        <div className="text-xs text-slate-600 font-arabic">
                          عرض خاص
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badges - Mobile Friendly */}
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs font-bold shadow-xl">
                    <div className="text-center">
                      <div>✨ Best Quality</div>
                      <div className="text-[9px] sm:text-[10px] opacity-90 font-somali">
                        Tayada Fiican
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-3 -left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-2 py-1 sm:px-3 sm:py-2 rounded-full text-xs font-bold shadow-xl">
                    <div className="text-center">
                      <div>🚚 Fast Delivery</div>
                      <div className="text-[9px] sm:text-[10px] opacity-90 font-somali">
                        Gaadiid Degdeg
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Section - Mobile Optimized */}
              <div className="mt-12 lg:mt-16 grid grid-cols-3 gap-4 sm:gap-8">
                <div className="text-center bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-2">
                    10K+
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 ">
                    Books Available
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-700 font-somali">
                    Buugaag Diyaar
                  </div>
                </div>
                <div className="text-center bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-2">
                    5K+
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 ">
                    Happy Students
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-700 font-somali">
                    Ardayda Farxada
                  </div>
                </div>
                <div className="text-center bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-300 shadow-lg">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-2">
                    24/7
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-somali">
                    Taageero
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-700 ">
                    Support
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section - Aligned with Customer Store */}
          <div className="relative bg-white border-t border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Fast Delivery •{" "}
                    <span className="font-somali font-normal">
                      Gaadiid Degdeg
                    </span>
                  </h3>
                  <p className="text-sm text-slate-700 ">
                    Same day delivery within Nairobi. Free shipping on orders
                    over KES 2,000
                  </p>
                </div>

                <div className="text-center group">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Quality Guaranteed •{" "}
                    <span className="font-somali font-normal">
                      Tayada La Damaanad Qaado
                    </span>
                  </h3>
                  <p className="text-sm text-slate-700 ">
                    All products are genuine and come with warranty. 100%
                    satisfaction guaranteed
                  </p>
                </div>

                <div className="text-center group">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Best Prices •{" "}
                    <span className="font-somali font-normal">
                      Qiimaha Ugu Fiican
                    </span>
                  </h3>
                  <p className="text-sm text-slate-700 ">
                    Competitive prices on all items. Price match guarantee
                    available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <div
          id="products-section"
          className="relative bg-gradient-to-br from-stone-50 to-amber-50"
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
  }
);

HeroSection.displayName = "HeroSection";

export default HeroSection;
