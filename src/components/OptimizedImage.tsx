import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Package } from "lucide-react";

interface OptimizedImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
  priority?: boolean;
  sizes?: string;
  preload?: boolean;
  forceFresh?: boolean; // New prop to force cache bypass
}

// Image cache to store loaded images with timestamps
const imageCache = new Map<string, { timestamp: number; url: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

// Generate cache-busting URL
const getCacheBustedUrl = (url: string, forceFresh: boolean = false): string => {
  if (!url) return url;
  
  // If forcing fresh or cache is expired, add timestamp
  const cached = imageCache.get(url);
  const now = Date.now();
  
  if (forceFresh || !cached || (now - cached.timestamp) > CACHE_DURATION) {
    const separator = url.includes('?') ? '&' : '?';
    const bustUrl = `${url}${separator}_t=${now}&_v=${Math.random().toString(36).substr(2, 9)}`;
    imageCache.set(url, { timestamp: now, url: bustUrl });
    return bustUrl;
  }
  
  return cached.url;
};

const OptimizedImage = memo(
  ({
    src,
    alt,
    className = "",
    fallbackClassName = "",
    onClick,
    priority = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
    preload = false,
    forceFresh = true, // Default to true for always fresh images
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [showImage, setShowImage] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Get cache-busted URL
    const imageUrl = src ? getCacheBustedUrl(src, forceFresh) : null;
    
    // Check if image is already cached
    const isCached = src ? imageCache.has(src) : false;

    const preloadImage = useCallback((imageUrl: string) => {
      if (imageCache.has(imageUrl)) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          if (src) {
            const now = Date.now();
            imageCache.set(src, { timestamp: now, url: imageUrl });
          }
          resolve();
        };
        img.onerror = reject;
        img.src = imageUrl;
        
        // Add cache control headers
        img.crossOrigin = "anonymous";
      });
    }, [src]);

    const handleLoad = useCallback(() => {
      if (src && imageUrl) {
        const now = Date.now();
        imageCache.set(src, { timestamp: now, url: imageUrl });
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
      if ((priority || preload) && imageUrl && !imageCache.has(src || '')) {
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
            fetchPriority={priority ? "high" : "auto"}
            sizes={sizes}
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "300px 200px",
              imageRendering: 'crisp-edges',
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
