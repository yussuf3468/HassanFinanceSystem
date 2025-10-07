import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  onCheckout,
}: CartSidebarProps) {
  const cart = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6" />
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-blue-700 rounded transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} in cart
          </p>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-full">
          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-slate-500 text-sm">
                  Gaarigaagu waa madhan - Add some products to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 text-sm line-clamp-2">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">
                          {item.product.category}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {/* Quantity Controls */}
                            <button
                              onClick={() =>
                                cart.updateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                              className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                cart.updateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                              className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
                              disabled={
                                item.quantity >= item.product.quantity_in_stock
                              }
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => cart.removeItem(item.product.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            KES {item.product.selling_price.toLocaleString()}{" "}
                            each
                          </p>
                          <p className="font-semibold text-blue-600">
                            KES{" "}
                            {(
                              item.product.selling_price * item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Total and Checkout */}
          {cart.items.length > 0 && (
            <div className="border-t bg-white p-4 space-y-4">
              {/* Subtotal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    Subtotal ({cart.totalItems} items)
                  </span>
                  <span className="font-medium">
                    KES {cart.totalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Delivery</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-bold text-xl text-blue-600">
                      KES {cart.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  Continue Shopping
                </button>

                {/* Clear Cart */}
                <button
                  onClick={cart.clearCart}
                  className="w-full text-red-500 hover:text-red-700 transition-colors text-sm py-1"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
