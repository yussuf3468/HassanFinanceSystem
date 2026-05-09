import { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";

interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  icon?: boolean;
}

export default function Alert({
  variant = "info",
  title,
  children,
  onClose,
  icon = true,
}: AlertProps) {
  const variants = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-200",
      icon: Info,
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    success: {
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-800 dark:text-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-800 dark:text-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-200",
      icon: AlertCircle,
      iconColor: "text-red-600 dark:text-red-400",
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl p-4 ${config.text}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <Icon
            className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`}
          />
        )}
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
