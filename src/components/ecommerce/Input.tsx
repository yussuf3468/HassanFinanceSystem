import { InputHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon: Icon,
      helperText,
      className = "",
      type = "text",
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full rounded-xl border-2 bg-white dark:bg-slate-900 
              text-sm sm:text-base text-slate-900 dark:text-white
              transition-all duration-300
              ${
                Icon ? "pl-10 sm:pl-12 pr-3 sm:pr-4" : "px-3 sm:px-4"
              } py-2.5 sm:py-3
              ${
                error
                  ? "border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20"
              }
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              disabled:opacity-50 disabled:cursor-not-allowed
              touch-manipulation
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
