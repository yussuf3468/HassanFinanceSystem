import { toast, ToastOptions } from "react-toastify";

interface CompactToastOptions
  extends Omit<ToastOptions, "className" | "progressClassName"> {
  variant?: "success" | "error" | "warning" | "info";
}

const getToastConfig = (
  variant: CompactToastOptions["variant"] = "success"
): Partial<ToastOptions> => {
  const baseConfig: Partial<ToastOptions> = {
    position: "bottom-right",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "!bg-white !border !rounded-lg !shadow-lg !min-h-12 !text-sm",
  };

  const variantConfig = {
    success: {
      className:
        "!bg-white !text-slate-900 !border-green-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
      progressClassName: "!bg-green-500",
    },
    error: {
      className:
        "!bg-white !text-slate-900 !border-red-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
      progressClassName: "!bg-red-500",
    },
    warning: {
      className:
        "!bg-white !text-slate-900 !border-yellow-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
      progressClassName: "!bg-yellow-500",
    },
    info: {
      className:
        "!bg-white !text-slate-900 !border-blue-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
      progressClassName: "!bg-blue-500",
    },
  };

  return {
    ...baseConfig,
    ...variantConfig[variant],
  };
};

export const compactToast = {
  success: (
    message: string | React.ReactNode,
    options?: CompactToastOptions
  ) => {
    return toast.success(message, { ...getToastConfig("success"), ...options });
  },

  error: (message: string | React.ReactNode, options?: CompactToastOptions) => {
    return toast.error(message, { ...getToastConfig("error"), ...options });
  },

  warning: (
    message: string | React.ReactNode,
    options?: CompactToastOptions
  ) => {
    return toast.warning(message, { ...getToastConfig("warning"), ...options });
  },

  info: (message: string | React.ReactNode, options?: CompactToastOptions) => {
    return toast.info(message, { ...getToastConfig("info"), ...options });
  },

  // Special variants
  addToCart: (productName: string, options?: CompactToastOptions) => {
    return toast.success(
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 text-sm">Added to cart!</p>
          <p className="text-xs text-slate-600 truncate">{productName}</p>
        </div>
      </div>,
      {
        ...getToastConfig("success"),
        autoClose: 2000,
        ...options,
      }
    );
  },

  addToWishlist: (options?: CompactToastOptions) => {
    return toast.success("Added to wishlist! ❤️", {
      ...getToastConfig("success"),
      autoClose: 2000,
      className:
        "!bg-white !text-slate-900 !border-pink-200 !rounded-lg !shadow-lg !min-h-12 !text-sm",
      progressClassName: "!bg-pink-500",
      ...options,
    });
  },

  orderSuccess: (orderNumber: string, options?: CompactToastOptions) => {
    return toast.success(`Order ${orderNumber} placed successfully!`, {
      ...getToastConfig("success"),
      autoClose: 4000,
      position: "top-center",
      ...options,
    });
  },
};

export default compactToast;
