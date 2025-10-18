/**
 * EXAMPLE: How to Convert Dashboard Component to Use Caching
 * 
 * This file shows before/after comparison of implementing React Query caching
 * Copy this pattern to other components (Search, Inventory, etc.)
 */

// ============================================
// BEFORE (High Egress Cost) ❌
// ============================================

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DashboardOld() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData(); // Fetches EVERY time component mounts!
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Problem: Fetches full data every time (500KB+)
    const [productsRes, salesRes] = await Promise.all([
      supabase.from("products").select("*"), // ❌ Expensive
      supabase.from("sales").select("*"),    // ❌ Expensive
    ]);

    setProducts(productsRes.data || []);
    setSales(salesRes.data || []);
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products: {products.length}</h1>
      {products.map(p => (
        <div key={p.id}>
          <img src={p.image_url} /> {/* ❌ Full-size image */}
          <h3>{p.name}</h3>
        </div>
      ))}
    </div>
  );
}

// ============================================
// AFTER (Cached - 90% Cost Reduction) ✅
// ============================================

import { useProducts, useSales } from "../hooks/useSupabaseQuery";
import OptimizedImage from "./OptimizedImage";

export default function DashboardNew() {
  // ✅ Cached for 5 minutes - only fetches once!
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: sales = [], isLoading: salesLoading } = useSales();

  const loading = productsLoading || salesLoading;

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Products: {products.length}</h1>
      {products.map(p => (
        <div key={p.id}>
          {/* ✅ Optimized to 300px, WebP format, cached */}
          <OptimizedImage 
            src={p.image_url} 
            alt={p.name}
            preset="product"
          />
          <h3>{p.name}</h3>
        </div>
      ))}
    </div>
  );
}

// ============================================
// COST COMPARISON
// ============================================

/**
 * OLD VERSION (per user session):
 * - Component mounts 10 times
 * - Each mount fetches 500KB of data
 * - Total: 5MB of database egress
 * - Images: 50 products × 2MB = 100MB
 * - TOTAL: 105MB per session
 * 
 * NEW VERSION (per user session):
 * - First mount fetches 500KB (cached for 5 min)
 * - Next 9 mounts use cache: 0KB
 * - Total: 500KB of database egress
 * - Images: 50 products × 200KB (optimized) = 10MB (cached)
 * - TOTAL: 10.5MB per session
 * 
 * SAVINGS: 90% reduction! 💰
 */

// ============================================
// HOW TO INVALIDATE CACHE AFTER MUTATIONS
// ============================================

import { useQueryClient } from "@tanstack/react-query";

export function ProductForm() {
  const queryClient = useQueryClient();

  async function handleSubmit(productData) {
    // Save to database
    await supabase.from("products").insert(productData);

    // ✅ Invalidate cache so next fetch gets fresh data
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  return <form onSubmit={handleSubmit}>...</form>;
}

// ============================================
// IMAGE OPTIMIZATION EXAMPLES
// ============================================

// ❌ OLD: Full-size image (2MB each)
<img src={product.image_url} className="w-20 h-20" />

// ✅ NEW: Thumbnail (50KB, cached)
<OptimizedImage 
  src={product.image_url} 
  alt={product.name}
  preset="thumbnail"  // 100px width
  className="w-20 h-20"
/>

// ✅ Product card (150KB, cached)
<OptimizedImage 
  src={product.image_url} 
  preset="product"  // 300px width
/>

// ✅ Product detail page (400KB, cached)
<OptimizedImage 
  src={product.image_url} 
  preset="productLarge"  // 600px width
/>

// ✅ Force fresh load (admin editing images)
<OptimizedImage 
  src={product.image_url} 
  forceFresh={true}
  preset="large"
/>
