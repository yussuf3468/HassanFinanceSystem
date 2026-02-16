import { Star, ArrowRight } from "lucide-react";
import { Product } from "../../types";
import ProductCardEcommerce from "./ProductCard";
import Container from "./Container";
import Button from "./Button";
import { ProductGridSkeleton } from "./Skeletons";

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export default function FeaturedProducts({
  products,
  onAddToCart,
  onQuickView,
  onViewAll,
  isLoading = false,
}: FeaturedProductsProps) {
  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-900">
        <Container>
          <div className="text-center mb-8">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
          </div>
          <ProductGridSkeleton count={4} />
        </Container>
      </section>
    );
  }

  // Show first 8 products as featured (sorted by price/popularity from parent)
  const featuredProducts = products.slice(0, 8);

  return (
    <section className="py-12 lg:py-16 bg-slate-50 dark:bg-slate-900">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Featured Products
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Top Picks For You
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover our carefully selected collection of premium products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {featuredProducts.map((product, index) => (
            <ProductCardEcommerce
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              index={index}
            />
          ))}
        </div>

        {/* View All Button */}
        {onViewAll && featuredProducts.length > 0 && (
          <div className="text-center">
            <Button
              onClick={onViewAll}
              variant="outline"
              size="lg"
              className="group"
            >
              View All Products
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
