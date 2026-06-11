import { Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import Drawer from "./ecommerce/Drawer";

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
    <Drawer isOpen={isOpen} onClose={onClose} title="Your Bag" size="md">
      <div className="flex flex-col h-full bg-white dark:bg-black">
        {/* Cart Items Count */}
        <div className="px-4 py-3 bg-[#f5f5f7] dark:bg-[#1d1d1f] border-b border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]">
              {cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} in your bag
            </span>
            <span className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
              KES {cart.totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 bg-[#f5f5f7] dark:bg-black">
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white dark:bg-[#1d1d1f] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ShoppingBag className="w-9 h-9 text-[#86868b]" />
              </div>
              <h3 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-1">
                Your bag is empty
              </h3>
              <p className="text-[14px] text-[#86868b] dark:text-[#a1a1a6] mb-6">
                Add some products to get started.
              </p>
              <button
                onClick={onClose}
                className="h-11 px-6 bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white dark:bg-[#1d1d1f] rounded-2xl p-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-[#86868b]" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#1d1d1f] dark:text-white text-[15px] mb-1 line-clamp-2 leading-snug">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
                          KES {item.product.selling_price.toLocaleString()}
                        </p>
                        {item.product.quantity_in_stock < 10 && (
                          <span className="text-[11px] font-medium text-[#bf4800] dark:text-[#ff9f0a] bg-[#fff4e5] dark:bg-[#ff9f0a]/10 px-2 py-0.5 rounded-full">
                            Low stock
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-[#f5f5f7] dark:bg-[#2c2c2e] rounded-full">
                          <button
                            onClick={() =>
                              cart.updateQuantity(
                                item.product.id,
                                Math.max(0, item.quantity - 1),
                              )
                            }
                            aria-label="Decrease quantity"
                            className="w-9 h-9 flex items-center justify-center text-[#1d1d1f] dark:text-white hover:text-[#1d1d1f] dark:hover:text-white transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-[15px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
                            {item.quantity}
                          </span>
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
                            aria-label="Increase quantity"
                            className="w-9 h-9 flex items-center justify-center text-[#1d1d1f] dark:text-white hover:text-[#1d1d1f] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => cart.removeItem(item.product.id)}
                          aria-label="Remove from bag"
                          className="w-9 h-9 flex items-center justify-center text-[#86868b] hover:text-[#ff3b30] rounded-full hover:bg-[#f5f5f7] dark:hover:bg-[#2c2c2e] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                        <div className="flex justify-between text-[13px]">
                          <span className="text-[#86868b] dark:text-[#a1a1a6]">
                            Subtotal
                          </span>
                          <span className="font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
                            KES{" "}
                            {(
                              item.product.selling_price * item.quantity
                            ).toLocaleString()}
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
          <div className="border-t border-black/5 dark:border-white/10 p-4 bg-white dark:bg-black">
            <div className="space-y-2.5 mb-4">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#86868b] dark:text-[#a1a1a6]">
                  Subtotal
                </span>
                <span className="font-medium text-[#1d1d1f] dark:text-white tabular-nums">
                  KES {cart.totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#86868b] dark:text-[#a1a1a6]">
                  Delivery
                </span>
                <span className="text-[#86868b] dark:text-[#a1a1a6]">
                  Calculated at checkout
                </span>
              </div>
              <div className="pt-2.5 border-t border-black/5 dark:border-white/10 flex justify-between items-baseline">
                <span className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">
                  Total
                </span>
                <span className="text-[19px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
                  KES {cart.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {cart.totalPrice < 2000 && (
              <p className="text-[12px] text-[#86868b] dark:text-[#a1a1a6] text-center mb-3">
                Free delivery on orders over KES 2,000
              </p>
            )}

            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onCheckout?.();
                }}
                className="w-full h-12 flex items-center justify-center bg-[#1d1d1f] hover:bg-black dark:bg-white dark:hover:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] text-[15px] font-medium rounded-full transition-colors"
              >
                Check out
              </button>
              <button
                onClick={onClose}
                className="w-full h-11 flex items-center justify-center text-[#1d1d1f] dark:text-white text-[15px] font-medium rounded-full hover:bg-[#f5f5f7] dark:hover:bg-[#1d1d1f] transition-colors"
              >
                Continue shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
