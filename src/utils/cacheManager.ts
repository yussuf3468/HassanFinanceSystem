// Cache Management Utilities
export class CacheManager {
  // Force clear image cache and refresh
  static async forceRefreshImages(): Promise<void> {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        // Send message to service worker to clear cache
        const messageChannel = new MessageChannel();

        const promise = new Promise<void>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.success) {
              console.log("Cache cleared successfully");
              resolve();
            }
          };
        });

        navigator.serviceWorker.controller.postMessage(
          { type: "FORCE_REFRESH_IMAGES" },
          [messageChannel.port2]
        );

        await promise;
      }

      // Force refresh all images on page
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        const originalSrc = img.src;
        if (originalSrc) {
          const separator = originalSrc.includes("?") ? "&" : "?";
          img.src = `${originalSrc}${separator}_bust=${Date.now()}&_v=${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }
      });

      console.log("Images force refreshed");
    } catch (error) {
      console.error("Failed to force refresh images:", error);
    }
  }

  // Auto-refresh images on page visibility change
  static enableAutoRefresh(): void {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Page became visible, check if we need to refresh images
        setTimeout(() => {
          CacheManager.forceRefreshImages();
        }, 500);
      }
    });

    // Also refresh on focus
    window.addEventListener("focus", () => {
      setTimeout(() => {
        CacheManager.forceRefreshImages();
      }, 500);
    });
  }

  // Check if browser supports cache busting
  static isCacheBustingSupported(): boolean {
    return "serviceWorker" in navigator && "caches" in window;
  }

  // Get cache bust parameter
  static getCacheBustParam(): string {
    return `_t=${Date.now()}&_v=${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ❌ DISABLED: This old cache manager conflicts with React Query and OptimizedImage
// The new system handles caching properly without force-refreshing images
// Initialize auto-refresh on load
// if (typeof window !== "undefined") {
//   window.addEventListener("load", () => {
//     CacheManager.enableAutoRefresh();
//     console.log("Cache manager initialized with auto-refresh");
//   });
// }
