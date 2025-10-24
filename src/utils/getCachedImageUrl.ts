// getCachedImageUrl.ts
// Returns a Vercel proxy URL for a Supabase image, with 1-year cache and fallback support.

const FALLBACK_IMAGE = "https://finance.lenzro.com/fallback-image.png";

/**
 * Returns a proxy URL for a Supabase image, cached for 1 year via Vercel edge function.
 * @param supabaseUrl The original Supabase image URL
 * @returns The proxied, cache-optimized image URL
 */
export function getCachedImageUrl(supabaseUrl: string): string {
  if (!supabaseUrl) return FALLBACK_IMAGE;
  try {
    // Encode the original image URL for proxying
    const encoded = encodeURIComponent(supabaseUrl);
    // The Vercel edge function should be set up at /api/image-proxy
    return `https://finance.lenzro.com/api/image-proxy?url=${encoded}`;
  } catch {
    return FALLBACK_IMAGE;
  }
}

// Usage: <img src={getCachedImageUrl(supabaseImageUrl)} ... />
// The /api/image-proxy endpoint must:
// - Fetch the image from the given URL
// - Set Cache-Control: public, max-age=31536000, immutable
// - Return fallback image if fetch fails
