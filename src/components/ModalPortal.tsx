import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: ReactNode;
  onClose?: () => void;
}

export default function ModalPortal({ children, onClose }: ModalPortalProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  if (!elRef.current) elRef.current = document.createElement("div");

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);

    // Handle Escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.removeChild(el);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {children}
    </div>,
    elRef.current
  );
}
