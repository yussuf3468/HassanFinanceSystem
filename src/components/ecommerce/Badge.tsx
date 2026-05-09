import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md" | "lg";
}

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    warning:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    purple: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
