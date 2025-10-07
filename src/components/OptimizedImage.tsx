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
}

const OptimizedImage = memo(
  ({
    src,
    alt,
    className = "",
    fallbackClassName = "",
    onClick,
    priority = false,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  }: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLDivElement>(null);

    const handleLoad = useCallback(() => {
      setIsLoaded(true);
    }, []);

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

    // Set up intersection observer for lazy loading
    useEffect(() => {
      if (!priority && !isInView && imgRef.current) {
        const observer = new IntersectionObserver(handleIntersection, {
          threshold: 0.1,
          rootMargin: "50px",
        });
        observer.observe(imgRef.current);

        return () => observer.disconnect();
      }
    }, [handleIntersection, priority, isInView]);

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
      <div ref={imgRef} className="relative" onClick={onClick}>
        {/* Loading placeholder */}
        {!isLoaded && (
          <div
            className={`absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse ${fallbackClassName}`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 sm:w-12 sm:h-12 text-slate-300 animate-pulse" />
            </div>
          </div>
        )}

        {/* Actual image - only load when in view or priority */}
        {(isInView || priority) && (
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
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

export default OptimizedImage;
