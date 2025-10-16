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
    <div className="p-3 border rounded-xl bg-white">
      <div className="font-semibold truncate">{product.name}</div>
      <div className="text-purple-600 font-semibold text-sm">
        KES {product.selling_price.toLocaleString()}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          className="px-3 py-1 rounded-lg bg-blue-600 text-white"
          onClick={() => onQuickView(product)}
        >
          View
        </button>
        <button
          className="px-3 py-1 rounded-lg border"
          onClick={() => onAddToCart(product)}
        >
          Add
        </button>
      </div>
    </div>
  );
}
