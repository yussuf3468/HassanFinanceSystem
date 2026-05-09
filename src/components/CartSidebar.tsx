import { Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import Drawer from "./ecommerce/Drawer";
import Button from "./ecommerce/Button";
import Badge from "./ecommerce/Badge";
import Tooltip from "./ecommerce/Tooltip";
import Alert from "./ecommerce/Alert";

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

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Shopping Cart" size="md">
      <div className="flex flex-col h-full">
        {/* Cart Items Count Badge */}
        <div className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-100 dark:border-violet-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} in cart
            </span>
            <Badge variant="purple" size="sm">
              KES {cart.totalPrice.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-12 h-12 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Your cart is empty
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Add some products to get started
              </p>
              <Button onClick={onClose} variant="primary" size="md">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:shadow-lg"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-lg font-bold text-violet-600">
                          KES {item.product.selling_price.toLocaleString()}
                        </p>
                        {item.product.quantity_in_stock < 10 && (
                          <Badge variant="warning" size="sm">
                            Low Stock
                          </Badge>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tooltip content="Decrease quantity" position="top">
                            <button
                              onClick={() =>
                                cart.updateQuantity(
                                  item.product.id,
                                  Math.max(0, item.quantity - 1),
                                )
                              }
                              className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-violet-100 dark:hover:bg-violet-900 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <span className="w-12 text-center font-semibold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>

                          <Tooltip content="Increase quantity" position="top">
                            <button
                              onClick={() =>
                                cart.updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                )
                              }
                              disabled={
                                item.quantity >= item.product.quantity_in_stock
                              }
                              className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-violet-100 dark:hover:bg-violet-900 text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>

                        <Tooltip content="Remove from cart" position="top">
                          <button
                            onClick={() => cart.removeItem(item.product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Subtotal */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            Subtotal:
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            $
                            {(
                              item.product.selling_price * item.quantity
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total & Checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Subtotal
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  KES {cart.totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Shipping
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Calculated at checkout
                </span>
              </div>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-lg font-bold text-violet-600">
                    KES {cart.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Alert variant="info" icon={true}>
              Free shipping on orders over KES 2,000!
            </Alert>

            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  onClose();
                  onCheckout?.();
                }}
                variant="primary"
                size="lg"
                fullWidth
              >
                Proceed to Checkout
              </Button>
              <Button onClick={onClose} variant="outline" size="md" fullWidth>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
