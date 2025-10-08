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
}

// Image cache to store loaded images
const imageCache = new Set<string>();

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
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [showImage, setShowImage] = useState(false);
    const imgRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Check if image is already cached
    const isCached = src ? imageCache.has(src) : false;

    const preloadImage = useCallback((imageUrl: string) => {
      if (imageCache.has(imageUrl)) return Promise.resolve();

      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.add(imageUrl);
          resolve();
        };
        img.onerror = reject;
        img.src = imageUrl;
      });
    }, []);

    const handleLoad = useCallback(() => {
      if (src) {
        imageCache.add(src);
      }
      setIsLoaded(true);
      // Small delay for smooth transition
      setTimeout(() => setShowImage(true), 50);
    }, [src]);

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
      if ((priority || preload) && src && !imageCache.has(src)) {
        preloadImage(src).catch(() => {
          // Ignore preload errors
        });
      }
    }, [src, priority, preload, preloadImage]);

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
            src={src}
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
