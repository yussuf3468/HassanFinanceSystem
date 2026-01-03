import React, { useState } from "react";
import { Package, AlertTriangle, X } from "lucide-react";

interface OutOfStockItem {
  product: {
    id: string;
    name: string;
    quantity_in_stock: number;
  };
  requested: number;
  available: number;
  shortage: number;
}

interface StockReceiveModalProps {
  isOpen: boolean;
  item: OutOfStockItem | null;
  onReceiveStock: (quantity: number, source: string) => void;
  onSkipItem: () => void;
  onCancel: () => void;
}

export const StockReceiveModal: React.FC<StockReceiveModalProps> = ({
  isOpen,
  item,
  onReceiveStock,
  onSkipItem,
  onCancel,
}) => {
  const [quantity, setQuantity] = useState<string>("");
  const [source, setSource] = useState<string>("Quick Restock");
  const [error, setError] = useState<string>("");

  React.useEffect(() => {
    if (item) {
      setQuantity(item.shortage.toString());
      setSource("Quick Restock");
      setError("");
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qtyReceived = parseInt(quantity);
    if (isNaN(qtyReceived) || qtyReceived <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    if (qtyReceived < item.shortage) {
      setError(
        `Warning: You're receiving ${qtyReceived} units but need ${item.shortage} units. This is still not enough stock.`
      );
      return;
    }

    setError("");
    onReceiveStock(qtyReceived, source);
  };

  const handleSkip = () => {
    const qtyReceived = parseInt(quantity);
    if (qtyReceived > 0 && qtyReceived < item.shortage) {
      // Allow partial receive + skip
      onReceiveStock(qtyReceived, source);
    } else {
      onSkipItem();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Out of Stock</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-900 hover:bg-gradient-to-br hover:from-amber-50 hover:to-white rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Package className="w-5 h-5 text-rose-700 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {item.product.name}
                </p>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p>
                    Requested:{" "}
                    <span className="font-medium text-gray-900">
                      {item.requested} units
                    </span>
                  </p>
                  <p>
                    Available:{" "}
                    <span className="font-medium text-rose-700">
                      {item.available} units
                    </span>
                  </p>
                  <p>
                    Shortage:{" "}
                    <span className="font-medium text-rose-700">
                      {item.shortage} units
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Receive <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError("");
              }}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={`Minimum: ${item.shortage}`}
              autoFocus
            />
            {parseInt(quantity) < item.shortage && parseInt(quantity) > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ This is less than the shortage. You can receive this amount
                and skip the item.
              </p>
            )}
          </div>

          {/* Source Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Source
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Nearby Shop, Warehouse"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be recorded in the stock receipt trail
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-br from-white to-amber-50/30 border border-orange-200 rounded-xl p-3">
              <p className="text-sm text-orange-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              ✅ Receive Stock & Continue Sale
            </button>

            {parseInt(quantity) > 0 && parseInt(quantity) < item.shortage && (
              <button
                type="button"
                onClick={handleSkip}
                className="w-full bg-gradient-to-br from-white to-amber-50/300 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold transition-all"
              >
                📦 Receive Partial & Skip Item
              </button>
            )}

            <button
              type="button"
              onClick={onSkipItem}
              className="w-full bg-gray-500 hover:bg-gray-600 text-slate-900 py-2.5 px-4 rounded-xl font-medium transition-all"
            >
              Skip Item (No Stock Receive)
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="w-full bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 py-2.5 px-4 rounded-xl font-medium border-2 border-gray-300 dark:border-slate-600 transition-all"
            >
              ❌ Cancel Entire Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
