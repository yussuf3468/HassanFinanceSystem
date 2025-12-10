/**
 * Advanced Search Utilities for Hassan Bookshop
 * Implements fuzzy matching, scoring, and intelligent search
 */

import type { Product } from "../types";

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarityScore(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(
    longer.toLowerCase(),
    shorter.toLowerCase()
  );
  return (longer.length - distance) / longer.length;
}

/**
 * Check if string contains substring with fuzzy matching
 */
function fuzzyContains(text: string, query: string, threshold = 0.7): boolean {
  if (!text || !query) return false;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match
  if (textLower.includes(queryLower)) return true;

  // Check if any word in text fuzzy matches the query
  const words = textLower.split(/\s+/);
  return words.some((word) => similarityScore(word, queryLower) >= threshold);
}

export interface SearchResult {
  product: Product;
  score: number;
  matchType: "exact" | "fuzzy" | "partial";
  matchedFields: string[];
}

/**
 * Advanced product search with scoring and fuzzy matching
 */
export function searchProducts(
  products: Product[],
  searchTerm: string,
  options: {
    fuzzyThreshold?: number;
    includeDescription?: boolean;
    maxResults?: number;
  } = {}
): SearchResult[] {
  const {
    fuzzyThreshold = 0.7,
    includeDescription = true,
    maxResults = 100,
  } = options;

  if (!searchTerm.trim()) {
    return products.map((product) => ({
      product,
      score: 1,
      matchType: "exact" as const,
      matchedFields: [],
    }));
  }

  const queryLower = searchTerm.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const product of products) {
    let score = 0;
    let matchType: "exact" | "fuzzy" | "partial" = "partial";
    const matchedFields: string[] = [];

    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();

    // Exact match in name (highest priority)
    if (nameLower === queryLower) {
      score += 100;
      matchType = "exact";
      matchedFields.push("name");
    }
    // Name starts with query
    else if (nameLower.startsWith(queryLower)) {
      score += 80;
      matchType = "exact";
      matchedFields.push("name");
    }
    // Name contains query
    else if (nameLower.includes(queryLower)) {
      score += 60;
      matchType = "exact";
      matchedFields.push("name");
    }
    // Fuzzy match in name
    else if (fuzzyContains(nameLower, queryLower, fuzzyThreshold)) {
      score += 40;
      matchType = "fuzzy";
      matchedFields.push("name");
    }

    // Category exact match
    if (categoryLower === queryLower) {
      score += 50;
      matchedFields.push("category");
    }
    // Category contains query
    else if (categoryLower.includes(queryLower)) {
      score += 30;
      matchedFields.push("category");
    }
    // Fuzzy match in category
    else if (fuzzyContains(categoryLower, queryLower, fuzzyThreshold)) {
      score += 20;
      matchedFields.push("category");
    }

    // Search in description if available
    if (includeDescription && product.description) {
      const descLower = product.description.toLowerCase();
      if (descLower.includes(queryLower)) {
        score += 15;
        matchedFields.push("description");
      } else if (fuzzyContains(descLower, queryLower, fuzzyThreshold)) {
        score += 10;
        matchedFields.push("description");
      }
    }

    // Boost for in-stock products
    if (product.quantity_in_stock > 0) {
      score += 5;
    }

    // Boost for featured products
    if (product.featured) {
      score += 3;
    }

    if (score > 0) {
      results.push({
        product,
        score,
        matchType,
        matchedFields,
      });
    }
  }

  // Sort by score (descending) and limit results
  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

export type SortOption =
  | "relevance"
  | "price-low"
  | "price-high"
  | "name-asc"
  | "name-desc"
  | "newest";

/**
 * Sort search results based on option
 */
export function sortProducts(
  results: SearchResult[],
  sortBy: SortOption
): SearchResult[] {
  const sorted = [...results];

  switch (sortBy) {
    case "relevance":
      // Already sorted by score
      return sorted;

    case "price-low":
      return sorted.sort(
        (a, b) => a.product.selling_price - b.product.selling_price
      );

    case "price-high":
      return sorted.sort(
        (a, b) => b.product.selling_price - a.product.selling_price
      );

    case "name-asc":
      return sorted.sort((a, b) =>
        a.product.name.localeCompare(b.product.name)
      );

    case "name-desc":
      return sorted.sort((a, b) =>
        b.product.name.localeCompare(a.product.name)
      );

    case "newest":
      return sorted.sort((a, b) => {
        const dateA = new Date(a.product.created_at || 0).getTime();
        const dateB = new Date(b.product.created_at || 0).getTime();
        return dateB - dateA;
      });

    default:
      return sorted;
  }
}

/**
 * Highlight matching text in a string
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

/**
 * Get search suggestions based on partial input
 */
export function getSearchSuggestions(
  products: Product[],
  partialQuery: string,
  limit = 5
): string[] {
  if (!partialQuery.trim()) return [];

  const queryLower = partialQuery.toLowerCase();
  const suggestions = new Set<string>();

  // Get product name suggestions
  products.forEach((product) => {
    const nameLower = product.name.toLowerCase();
    if (nameLower.includes(queryLower)) {
      suggestions.add(product.name);
    }

    // Add category suggestions
    if (product.category.toLowerCase().includes(queryLower)) {
      suggestions.add(product.category);
    }
  });

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Filter products by category, price range, and availability
 */
export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featured?: boolean;
}

export function filterProducts(
  products: Product[],
  filters: FilterOptions
): Product[] {
  return products.filter((product) => {
    // Category filter
    if (filters.category && filters.category !== "all") {
      if (product.category !== filters.category) return false;
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      if (product.selling_price < filters.minPrice) return false;
    }
    if (filters.maxPrice !== undefined) {
      if (product.selling_price > filters.maxPrice) return false;
    }

    // Stock filter
    if (filters.inStockOnly) {
      if (product.quantity_in_stock <= 0) return false;
    }

    // Featured filter
    if (filters.featured) {
      if (!product.featured) return false;
    }

    return true;
  });
}

/**
 * Get unique categories from products
 */
export function getCategories(products: Product[]): string[] {
  const categories = new Set<string>();
  products.forEach((product) => {
    if (product.category) {
      categories.add(product.category);
    }
  });
  return Array.from(categories).sort();
}

/**
 * Get price range from products
 */
export function getPriceRange(products: Product[]): {
  min: number;
  max: number;
} {
  if (products.length === 0) return { min: 0, max: 0 };

  const prices = products.map((p) => p.selling_price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}
