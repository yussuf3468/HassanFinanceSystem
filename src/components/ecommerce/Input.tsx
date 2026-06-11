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
          <label className="block text-[13px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]">
              <Icon className="w-[18px] h-[18px]" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`
              w-full rounded-xl border bg-white dark:bg-[#2c2c2e]
              text-[15px] text-[#1d1d1f] dark:text-white
              transition-all
              ${Icon ? "pl-11 pr-4" : "px-4"} h-11
              ${
                error
                  ? "border-[#ff3b30] focus:border-[#ff3b30] focus:ring-2 focus:ring-[#ff3b30]/20"
                  : "border-black/10 dark:border-white/10 focus:border-[#1d1d1f] dark:focus:border-white focus:ring-2 focus:ring-[#1d1d1f]/15 dark:focus:ring-white/20"
              }
              placeholder:text-[#86868b]
              disabled:opacity-50 disabled:cursor-not-allowed
              outline-none touch-manipulation
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-[13px] font-medium text-[#ff3b30]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-[13px] text-[#86868b]">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
