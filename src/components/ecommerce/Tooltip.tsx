import { ReactNode, useState } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 200,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout: NodeJS.Timeout;

  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap animate-fade-in`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${
              position === "top"
                ? "bottom-[-4px] left-1/2 -translate-x-1/2"
                : position === "bottom"
                ? "top-[-4px] left-1/2 -translate-x-1/2"
                : position === "left"
                ? "right-[-4px] top-1/2 -translate-y-1/2"
                : "left-[-4px] top-1/2 -translate-y-1/2"
            }`}
          />
        </div>
      )}
    </div>
  );
}
