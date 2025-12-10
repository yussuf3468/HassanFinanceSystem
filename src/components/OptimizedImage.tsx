import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Package } from "lucide-react";
import {
  getOptimizedImageUrl,
  IMAGE_PRESETS,
} from "../utils/imageOptimization";
import { getCachedImageUrl } from "../utils/getCachedImageUrl";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  priority?: boolean;
  sizes?: string;
  preload?: boolean;
  forceFresh?: boolean;
  preset?: keyof typeof IMAGE_PRESETS; // Add preset option
}

// Image cache to store loaded images (NO timestamps - cache forever until manual refresh)
const imageCache = new Map<string, string>();

// Generate optimized and proxied URL (NO cache-busting for maximum caching)
const getProcessedUrl = (
  url: string,
  forceFresh: boolean = false,
  preset: keyof typeof IMAGE_PRESETS = "medium"
): string => {
  if (!url) return url;

  // Always proxy Supabase images through Vercel edge function for egress control
  let optimizedUrl = getOptimizedImageUrl(url, preset) || url;
  if (url.includes("supabase.co/storage")) {
    optimizedUrl = getCachedImageUrl(optimizedUrl);
  }

  // Check if we already have this URL cached
  const cacheKey = `${optimizedUrl}_${preset}`;
  const cached = imageCache.get(cacheKey);

  if (cached && !forceFresh) {
    return cached; // Return cached URL immediately
  }

  // Store in cache forever (browser will handle caching with proper headers)
  imageCache.set(cacheKey, optimizedUrl);

  return optimizedUrl;
};

const OptimizedImage = memo(
  ({
    src,
    alt,
    className = "",
    fallbackClassName = "",
    onClick,
    priority = false,
    preset = "medium",
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    preload = false,
    forceFresh = false, // Changed to false to use caching by default
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [showImage, setShowImage] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Get optimized and cache-busted URL
    const imageUrl = src ? getProcessedUrl(src, forceFresh, preset) : null;

    // Check if processed image URL is already cached
    const isCached = imageUrl ? imageCache.has(imageUrl) : false;

    const preloadImage = useCallback(
      (imageUrl: string) => {
        if (imageCache.has(imageUrl)) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (src) {
              imageCache.set(imageUrl, imageUrl); // Fixed: Cache just the URL
            }
            resolve();
          };
          img.onerror = reject;
          img.src = imageUrl;

          // Add cache control headers
          img.crossOrigin = "anonymous";
        });
      },
      [src]
    );

    const handleLoad = useCallback(() => {
      if (src && imageUrl) {
        imageCache.set(imageUrl, imageUrl); // Fixed: Cache just the URL
      }
      setIsLoaded(true);
      // Small delay for smooth transition
      setTimeout(() => setShowImage(true), 50);
    }, [src, imageUrl]);

    const handleError = useCallback(() => {
      setHasError(true);
      setIsLoaded(true);
    }, []);

    const handleIntersection = useCallback(
      (entries: IntersectionObserverEntry[]) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      []
    );

    // Preload critical images
    useEffect(() => {
      if ((priority || preload) && imageUrl && !imageCache.has(src || "")) {
        preloadImage(imageUrl).catch(() => {
          // Ignore preload errors
        });
      }
    }, [imageUrl, priority, preload, preloadImage, src]);

    // Set up intersection observer for lazy loading
    useEffect(() => {
      if (!priority && !isInView && imgRef.current) {
        const observer = new IntersectionObserver(handleIntersection, {
          threshold: 0.1,
          rootMargin: "100px", // Increased for earlier loading
        });
        observer.observe(imgRef.current);

        return () => observer.disconnect();
      }
    }, [handleIntersection, priority, isInView]);

    // Optimized loading for cached images
    useEffect(() => {
      if (src && isCached && !isLoaded) {
        setIsLoaded(true);
        setShowImage(true);
      }
    }, [src, isCached, isLoaded]);

    // Show fallback if no src or error occurred
    if (!src || hasError) {
      return (
        <div
          className={`bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 flex items-center justify-center group-hover:from-blue-100 group-hover:to-purple-200 transition-all duration-500 ${fallbackClassName}`}
          onClick={onClick}
        >
          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
        </div>
      );
    }

    return (
      <div ref={imgRef} className="relative overflow-hidden" onClick={onClick}>
        {/* Enhanced loading placeholder with shimmer effect */}
        {!showImage && (
          <div
            className={`absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse ${fallbackClassName}`}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-slate-300" />
            </div>
          </div>
        )}

        {/* Actual image - load when in view or priority */}
        {(isInView || priority) && (
          <img
            ref={imageRef}
            src={imageUrl || src}
            alt={alt}
            className={`transition-all duration-500 ease-out ${
              showImage ? "opacity-100 scale-100" : "opacity-0 scale-105"
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            sizes={sizes}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "300px 200px",
              imageRendering: "crisp-edges",
            }}
          />
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = "OptimizedImage";

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
