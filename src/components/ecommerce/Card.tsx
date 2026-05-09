import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      hoverable = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    const baseStyles = "rounded-2xl transition-all duration-300";

    const variants = {
      default: "bg-white dark:bg-slate-800 shadow-md",
      glass:
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/20",
      elevated: "bg-white dark:bg-slate-800 shadow-2xl shadow-amber-500/10",
      bordered:
        "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const hoverStyles = hoverable
      ? "hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export default Card;
