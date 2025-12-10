// getCachedImageUrl.ts
// Returns a same-origin proxy URL for a Supabase image, with 1-year cache and fallback support.

// Use a local, version-controlled fallback asset to avoid cross-domain and availability issues
const FALLBACK_IMAGE = "/fallback-image.svg";

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
    // Always target the same-origin edge function to work in any environment
    return `/api/image-proxy?url=${encoded}`;
  } catch {
    return FALLBACK_IMAGE;
  }
}

// Usage: <img src={getCachedImageUrl(supabaseImageUrl)} ... />
// The /api/image-proxy endpoint must:
// - Fetch the image from the given URL
// - Set Cache-Control: public, max-age=31536000, immutable
// - Return fallback image if fetch fails
