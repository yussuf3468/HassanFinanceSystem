import type { Product } from "../types";

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onQuickView: (p: Product) => void;
}) {
  return (
    <div className="p-3 border rounded-2xl bg-white dark:bg-slate-800 dark:border-slate-700">
      <div className="font-semibold truncate">{product.name}</div>
      <div className="text-amber-800 font-semibold font-semibold font-semibold text-sm">
        KES {product.selling_price.toLocaleString()}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          className="px-3 py-1 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all"
          onClick={() => onQuickView(product)}
        >
          View
        </button>
        <button
          className="px-3 py-1 rounded-xl border"
          onClick={() => onAddToCart(product)}
        >
          Add
        </button>
      </div>
    </div>
  );
}

