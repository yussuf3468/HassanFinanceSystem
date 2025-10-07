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
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0">
          {/* Floating shapes */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-transparent to-purple-50/80"></div>

          {/* Pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                <span>Trusted by 1000+ Customers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight">
                Your One-Stop
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  BookShop
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-600 mt-2">
                  Dukaan Online
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                From books to backpacks, electronics to essentials.
                <span className="block mt-2 text-lg">
                  📚 Quality products 🚚 Fast delivery 💰 Best prices
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <button
                  onClick={handleShopNowClick}
                  className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 transition-all duration-300 font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transform hover:scale-105 active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <ShoppingBag className="w-5 h-5 group-hover:animate-bounce" />
                    <span>Shop Now / Iibso Hadda</span>
                  </div>
                </button>

                <button
                  onClick={scrollToProducts}
                  className="group bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-2xl hover:bg-white transition-all duration-300 font-semibold text-lg border-2 border-slate-200 hover:border-blue-300 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
                >
                  <span className="group-hover:text-blue-600 transition-colors duration-300">
                    Browse Products
                  </span>
                </button>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Call: +254 722 979 547</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-slate-400 rounded-full"></div>
                <span>Free delivery in Nairobi</span>
              </div>

              {/* Address */}
              <div className="mt-4 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    📍 Global Apartment, Eastleigh, Section One, Nairobi
                  </span>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {/* Product previews */}
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-800">Books</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-800">
                        Electronics
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">
                        Stationery
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-4 aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-800">
                        Accessories
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  Best Prices!
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16 lg:mt-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Fast Delivery
                </h3>
                <p className="text-slate-600">
                  Same day delivery within Nairobi. Free shipping on orders over
                  KES 2,000
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Quality Guaranteed
                </h3>
                <p className="text-slate-600">
                  All products are genuine and come with warranty. 100%
                  satisfaction guaranteed
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Best Prices
                </h3>
                <p className="text-slate-600">
                  Competitive prices on all items. Price match guarantee
                  available
                </p>
              </div>
            </div>
          </div>

          {/* Featured Products Section */}
          <div className="mt-16 lg:mt-20">
            <FeaturedProducts
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
            />
          </div>
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export default HeroSection;
