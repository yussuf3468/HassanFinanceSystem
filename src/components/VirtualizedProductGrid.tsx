import React, { useMemo, useState, useEffect, useRef } from "react";
import { Product } from "../types";
import ProductCard from "./ProductCard";

interface VirtualizedProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  itemsPerRow?: number;
  itemHeight?: number;
  containerHeight?: number;
}

export default function VirtualizedProductGrid({
  products,
  onAddToCart,
  onQuickView,
  itemsPerRow = 4,
  itemHeight = 400,
  containerHeight = 800,
}: VirtualizedProductGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate responsive items per row
  const [actualItemsPerRow, setActualItemsPerRow] = useState(itemsPerRow);

  useEffect(() => {
    const updateItemsPerRow = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setActualItemsPerRow(1); // Mobile
      } else if (width < 1024) {
        setActualItemsPerRow(2); // Tablet
      } else if (width < 1280) {
        setActualItemsPerRow(3); // Desktop small
      } else {
        setActualItemsPerRow(4); // Desktop large
      }
    };

    updateItemsPerRow();
    window.addEventListener("resize", updateItemsPerRow);
    return () => window.removeEventListener("resize", updateItemsPerRow);
  }, []);

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < products.length; i += actualItemsPerRow) {
      result.push(products.slice(i, i + actualItemsPerRow));
    }
    return result;
  }, [products, actualItemsPerRow]);

  const totalHeight = rows.length * itemHeight;
  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight) + 1,
    rows.length
  );

  const visibleRows = rows.slice(visibleStartIndex, visibleEndIndex);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${visibleStartIndex * itemHeight}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleRows.map((row, rowIndex) => (
            <div
              key={visibleStartIndex + rowIndex}
              className="grid gap-6 mb-6"
              style={{
                gridTemplateColumns: `repeat(${actualItemsPerRow}, 1fr)`,
                height: itemHeight,
              }}
            >
              {row.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onQuickView={onQuickView}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
