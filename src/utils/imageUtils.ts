/**
 * Preloads critical images to improve performance
 */

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    const preloadPromises = urls.map(preloadImage);
    await Promise.all(preloadPromises);
    console.log("Critical images preloaded successfully");
  } catch (error) {
    console.warn("Failed to preload some images:", error);
  }
};

/**
 * Creates optimized image URLs with proper sizing
 */
export const getOptimizedImageUrl = (
  url: string,
  _width?: number,
  _height?: number,
  _quality = 85
): string => {
  // For future integration with image optimization services
  // Currently returns the original URL
  return url;
};

/**
 * Generates responsive image srcSet
 */
export const generateSrcSet = (baseUrl: string): string => {
  const sizes = [320, 640, 768, 1024, 1280, 1536];
  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, size)} ${size}w`)
    .join(", ");
};

/**
 * Critical images to preload on app start
 */
export const CRITICAL_IMAGES = [
  // Add URLs of hero images, featured product images, etc.
  // These will be preloaded for better user experience
];

/**
 * Image loading with retry mechanism
 */
export const loadImageWithRetry = (
  src: string,
  maxRetries = 3,
  retryDelay = 1000
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryLoad = () => {
      attempts++;
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => {
        if (attempts < maxRetries) {
          setTimeout(tryLoad, retryDelay);
        } else {
          reject(
            new Error(
              `Failed to load image after ${maxRetries} attempts: ${src}`
            )
          );
        }
      };
      img.src = src;
    };
    tryLoad();
  });
};
