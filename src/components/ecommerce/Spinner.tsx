import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "white" | "slate";
  text?: string;
  fullScreen?: boolean;
}

export default function Spinner({
  size = "md",
  color = "primary",
  text,
  fullScreen = false,
}: SpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colors = {
    primary: "text-amber-600",
    white: "text-white",
    slate: "text-slate-600 dark:text-slate-400",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size]} ${colors[color]} animate-spin`} />
      {text && (
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
