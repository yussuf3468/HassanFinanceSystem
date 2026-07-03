import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicCatalog } from "../../api";
import { storeConfig } from "../config/store";
import type { CategoryMeta, CollectionMeta } from "../config/types";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   Catalog intelligence — a single fetch of the published catalog,
   then memoized derived views (categories, collections, search,
   related products). All filtering is client-side and instant.
   ═══════════════════════════════════════════════════════════════ */

export interface ResolvedCategory extends CategoryMeta {
  count: number;
  inStockCount: number;
  /** Real product photo when available; config image otherwise. */
  coverImage: string;
  /** Raw DB category strings folded into this bucket. */
  rawNames: string[];
}

export function formatMoney(value: number): string {
  const { symbol, locale } = storeConfig.currency;
  return `${symbol} ${Math.round(value).toLocaleString(locale)}`;
}

export function isNewProduct(product: Product): boolean {
  const created = new Date(product.created_at).getTime();
  const cutoff = Date.now() - storeConfig.newProductDays * 24 * 60 * 60 * 1000;
  return created > cutoff;
}

export function isLowStock(product: Product): boolean {
  return (
    product.quantity_in_stock > 0 &&
    product.quantity_in_stock <= Math.max(product.reorder_level || 5, 5)
  );
}

export function resolveCategorySlug(rawCategory: string): string {
  const value = (rawCategory || "").toLowerCase();
  for (const meta of storeConfig.categories) {
    if (meta.keywords.some((k) => value.includes(k))) return meta.slug;
  }
  return "other";
}

const OTHER_CATEGORY: CategoryMeta = {
  slug: "other",
  label: "More Finds",
  keywords: [],
  tagline: "One-of-a-kind items that defy the shelves.",
  image: storeConfig.fallbackCategoryImage,
};

export function categoryMetaFor(slug: string): CategoryMeta {
  return storeConfig.categories.find((c) => c.slug === slug) ?? OTHER_CATEGORY;
}

export function useCatalog() {
  const query = useQuery({
    queryKey: ["storefront-catalog"],
    queryFn: getPublicCatalog,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const products = useMemo<Product[]>(() => {
    const list = (query.data ?? []) as Product[];
    // In-stock first, featured leading, newest within each group.
    return [...list].sort((a, b) => {
      const stockA = a.quantity_in_stock > 0 ? 0 : 1;
      const stockB = b.quantity_in_stock > 0 ? 0 : 1;
      if (stockA !== stockB) return stockA - stockB;
      const featA = a.featured ? 0 : 1;
      const featB = b.featured ? 0 : 1;
      if (featA !== featB) return featA - featB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [query.data]);

  const categories = useMemo<ResolvedCategory[]>(() => {
    const buckets = new Map<string, { products: Product[]; raw: Set<string> }>();
    for (const product of products) {
      const slug = resolveCategorySlug(product.category);
      const bucket = buckets.get(slug) ?? { products: [], raw: new Set<string>() };
      bucket.products.push(product);
      if (product.category) bucket.raw.add(product.category);
      buckets.set(slug, bucket);
    }

    const ordered = [...storeConfig.categories, OTHER_CATEGORY]
      .filter((meta) => buckets.has(meta.slug))
      .map((meta) => {
        const bucket = buckets.get(meta.slug)!;
        const withImage = bucket.products.find(
          (p) => p.image_url && p.quantity_in_stock > 0,
        );
        return {
          ...meta,
          count: bucket.products.length,
          inStockCount: bucket.products.filter((p) => p.quantity_in_stock > 0)
            .length,
          coverImage: withImage?.image_url || meta.image,
          rawNames: [...bucket.raw],
        };
      });

    return ordered.sort((a, b) => b.count - a.count);
  }, [products]);

  return {
    products,
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function productsForCategory(
  products: Product[],
  slug: string,
): Product[] {
  return products.filter((p) => resolveCategorySlug(p.category) === slug);
}

export function productsForCollection(
  products: Product[],
  collection: CollectionMeta,
): Product[] {
  switch (collection.rule.type) {
    case "featured":
      return products.filter((p) => p.featured);
    case "new": {
      const cutoff =
        Date.now() - collection.rule.days * 24 * 60 * 60 * 1000;
      return products.filter(
        (p) => new Date(p.created_at).getTime() > cutoff,
      );
    }
    case "under-price": {
      const max = collection.rule.max;
      return products.filter(
        (p) => p.selling_price <= max && p.quantity_in_stock > 0,
      );
    }
    case "categories": {
      const slugs = new Set(collection.rule.slugs);
      return products.filter((p) => slugs.has(resolveCategorySlug(p.category)));
    }
  }
}

export function relatedProducts(
  products: Product[],
  product: Product,
  limit = 8,
): Product[] {
  const slug = resolveCategorySlug(product.category);
  const sameCategory = products.filter(
    (p) => p.id !== product.id && resolveCategorySlug(p.category) === slug,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
  const rest = products.filter(
    (p) => p.id !== product.id && resolveCategorySlug(p.category) !== slug,
  );
  return [...sameCategory, ...rest].slice(0, limit);
}

/* ── Instant search ─────────────────────────────────────────── */

export interface SearchHit {
  product: Product;
  score: number;
}

export function searchProducts(
  products: Product[],
  rawQuery: string,
  limit = 8,
): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const tokens = query.split(/\s+/).filter(Boolean);

  const hits: SearchHit[] = [];
  for (const product of products) {
    const name = product.name.toLowerCase();
    const category = (product.category || "").toLowerCase();
    let score = 0;

    if (name === query) score += 120;
    else if (name.startsWith(query)) score += 80;
    else if (name.includes(query)) score += 50;

    for (const token of tokens) {
      if (name.includes(token)) score += 18;
      if (category.includes(token)) score += 10;
    }
    if (score === 0) continue;
    if (product.featured) score += 6;
    if (product.quantity_in_stock > 0) score += 8;
    hits.push({ product, score });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
