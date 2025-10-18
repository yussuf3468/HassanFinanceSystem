/**
 * Image Optimization Utilities
 * Reduces Supabase egress costs by:
 * 1. Using Supabase image transformation API
 * 2. Adding proper caching headers
 * 3. Lazy loading images
 * 4. Using optimized formats (WebP)
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "jpg" | "png";
}

/**
 * Optimize Supabase Storage image URL
 * Adds transformation parameters to reduce file size and enable CDN caching
 *
 * @example
 * const optimizedUrl = optimizeSupabaseImage(product.image_url, { width: 200, quality: 80 });
 */
export function optimizeSupabaseImage(
  url: string | null | undefined,
  options: ImageOptimizationOptions = {}
): string | null {
  if (!url) return null;

  const { width, height, quality = 80, format = "webp" } = options;

  // Check if it's a Supabase storage URL
  if (!url.includes("supabase.co/storage")) {
    return url;
  }

  // Build transformation parameters
  const params = new URLSearchParams();

  if (width) params.append("width", width.toString());
  if (height) params.append("height", height.toString());
  params.append("quality", quality.toString());
  params.append("format", format);

  // Check if URL already has query parameters
  const separator = url.includes("?") ? "&" : "?";

  return `${url}${separator}${params.toString()}`;
}

/**
 * Preset sizes for different use cases
 */
export const IMAGE_PRESETS = {
  thumbnail: { width: 100, quality: 70 },
  small: { width: 200, quality: 75 },
  medium: { width: 400, quality: 80 },
  large: { width: 800, quality: 85 },
  product: { width: 300, quality: 80 },
  productLarge: { width: 600, quality: 85 },
  avatar: { width: 150, quality: 75 },
} as const;

/**
 * Get optimized image URL using preset
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  preset: keyof typeof IMAGE_PRESETS = "medium"
): string | null {
  return optimizeSupabaseImage(url, IMAGE_PRESETS[preset]);
}

/**
 * Lazy load image with IntersectionObserver
 * Only loads images when they're about to be visible
 */
export function setupLazyLoading() {
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute("data-src");
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image is visible
      }
    );

    // Observe all images with data-src attribute
    document.querySelectorAll("img[data-src]").forEach((img) => {
      imageObserver.observe(img);
    });

    return imageObserver;
  }
  return null;
}

/**
 * Preload critical images
 * Use for above-the-fold images
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Calculate optimal image dimensions based on container
 */
export function getOptimalImageSize(
  containerWidth: number
): ImageOptimizationOptions {
  // Round up to nearest 100px to improve cache hit rate
  const width = Math.ceil(containerWidth / 100) * 100;

  return {
    width,
    quality: width > 800 ? 85 : 80,
  };
}
