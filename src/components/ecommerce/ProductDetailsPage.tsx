import { ArrowLeft, Package, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import type { Product } from "../../types";
import OptimizedImage from "../OptimizedImage";
import Badge from "./Badge";
import Button from "./Button";
import Card from "./Card";
import Container from "./Container";

interface ProductDetailsPageProps {
  product: Product;
  relatedProducts?: Product[];
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  onProductSelect?: (product: Product) => void;
}

export default function ProductDetailsPage({
  product,
  relatedProducts = [],
  onBack,
  onAddToCart,
  onProductSelect,
}: ProductDetailsPageProps) {
  const isOutOfStock = product.quantity_in_stock <= 0;
  const isLowStock = !isOutOfStock && product.quantity_in_stock <= product.reorder_level;

  return (
    <section className="min-h-screen bg-slate-50 py-8 dark:bg-slate-900 sm:py-12">
      <Container>
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card variant="elevated" padding="lg" className="overflow-hidden">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-slate-100 p-6 dark:from-slate-800 dark:to-slate-900">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
                <OptimizedImage
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                {product.featured && (
                  <div className="absolute left-4 top-4">
                    <Badge variant="warning" size="sm">
                      <Star className="mr-1 h-3 w-3 fill-current" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div>
              <Badge variant="purple" size="sm" className="mb-3">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
                {product.name}
              </h1>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span>Trusted customer favorite</span>
              </div>
            </div>

            <Card variant="bordered" padding="lg" className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-4xl font-black text-amber-600 dark:text-amber-400">
                  KES {product.selling_price.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Product ID: {product.product_id}
                </p>
              </div>

              {product.description ? (
                <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                  {product.description}
                </p>
              ) : (
                <p className="text-base leading-7 text-slate-500 dark:text-slate-400">
                  Carefully selected quality stock from Hassan Books.
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Availability
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {isOutOfStock
                      ? "Out of stock"
                      : `${product.quantity_in_stock} available`}
                  </p>
                  {isLowStock ? (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      Low stock. Order soon.
                    </p>
                  ) : null}
                </div>
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Delivery
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    Same-day in Eastleigh
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Quick dispatch for in-stock items.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Truck className="h-4 w-4 text-amber-500" />
                  Fast local delivery and order tracking
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  Trusted school and office supply stock
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Package className="h-4 w-4 text-amber-500" />
                  Packed securely before dispatch
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => onAddToCart(product)}
                  variant="primary"
                  size="lg"
                  className="sm:flex-1"
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {isOutOfStock ? "Unavailable" : "Add to Cart"}
                </Button>
                <Button
                  onClick={onBack}
                  variant="outline"
                  size="lg"
                  className="sm:flex-1"
                >
                  Continue Shopping
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Related Products
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Similar items customers browse with this product.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <button
                  key={relatedProduct.id}
                  onClick={() => onProductSelect?.(relatedProduct)}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <OptimizedImage
                      src={relatedProduct.image_url}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover"
                      fallbackClassName="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900"
                      sizes="(max-width: 1280px) 50vw, 25vw"
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      {relatedProduct.category}
                    </p>
                    <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
                      {relatedProduct.name}
                    </h3>
                    <p className="font-black text-amber-600 dark:text-amber-400">
                      KES {relatedProduct.selling_price.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
