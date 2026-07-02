import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import type { Product } from "../../types";

/** Horizontal snap rail of product cards with edge-arrow controls. */
export default function ProductRail({ products }: { products: Product[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: true });

  function updateArrows() {
    const rail = railRef.current;
    if (!rail) return;
    setCanScroll({
      left: rail.scrollLeft > 16,
      right: rail.scrollLeft < rail.scrollWidth - rail.clientWidth - 16,
    });
  }

  function scrollBy(direction: 1 | -1) {
    railRef.current?.scrollBy({
      left: direction * Math.min(railRef.current.clientWidth * 0.8, 640),
      behavior: "smooth",
    });
  }

  if (products.length === 0) return null;

  return (
    <div className="group/rail relative">
      <div
        ref={railRef}
        onScroll={updateArrows}
        className="sf-no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:gap-6"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[46vw] max-w-[280px] shrink-0 snap-start sm:w-[260px]"
          >
            <ProductCard product={product} compact />
          </div>
        ))}
      </div>

      {(["left", "right"] as const).map((side) => {
        const enabled = side === "left" ? canScroll.left : canScroll.right;
        if (!enabled) return null;
        return (
          <button
            key={side}
            type="button"
            aria-label={`Scroll ${side}`}
            onClick={() => scrollBy(side === "left" ? -1 : 1)}
            className={`sf-glass absolute top-[38%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-all duration-300 hover:scale-110 group-hover/rail:opacity-100 sm:flex ${
              side === "left" ? "-left-3" : "-right-3"
            }`}
            style={{ color: "var(--sf-ink)" }}
          >
            {side === "left" ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
