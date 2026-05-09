import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 touch-manipulation";

    const variants = {
      primary:
        "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/50 hover:shadow-xl hover:shadow-amber-500/60 hover:from-amber-700 hover:to-yellow-700",
      secondary:
        "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/50 hover:shadow-xl hover:shadow-amber-500/60 hover:from-amber-600 hover:to-yellow-600",
      outline:
        "border-2 border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 dark:border-amber-400 dark:text-amber-400",
      ghost:
        "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
      danger:
        "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 hover:from-red-600 hover:to-rose-600",
    };

    const sizes = {
      sm: "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm gap-1.5",
      md: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base gap-2",
      lg: "px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg gap-2.5",
    };

    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
