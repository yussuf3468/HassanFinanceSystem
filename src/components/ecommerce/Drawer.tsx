import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

export default function Drawer({
  isOpen,
  onClose,
  children,
  title,
  position = "right",
  size = "md",
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  const slideIn =
    position === "right" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed ${
          position === "right" ? "right-0" : "left-0"
        } top-0 h-full ${
          sizes[size]
        } w-full bg-white dark:bg-black shadow-2xl z-50 flex flex-col ${slideIn}`}
      >
        {title && (
          <div className="flex items-center justify-between px-4 h-14 border-b border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
            <h2 className="text-[17px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
      </div>
    </>
  );
}
