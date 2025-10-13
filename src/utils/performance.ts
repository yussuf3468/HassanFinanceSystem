/**
 * Performance monitoring utilities for Hassan Muse BookShop
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  resourceCount: number;
  bundleSize: number;
  imageLoadTime: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  init() {
    if (typeof window === "undefined" || !("performance" in window)) {
      return;
    }

    this.measurePageLoad();
    this.observeResourceTiming();
    this.observeLargestContentfulPaint();
    this.observeFirstInputDelay();
  }

  private measurePageLoad() {
    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.renderTime =
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart;

      console.log("📊 Page Load Performance:", {
        loadTime: `${this.metrics.loadTime.toFixed(2)}ms`,
        renderTime: `${this.metrics.renderTime.toFixed(2)}ms`,
      });
    });
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const resources = entries.filter(
        (entry) => entry.entryType === "resource"
      );

      this.metrics.resourceCount = resources.length;

      // Track image loading performance
      const images = resources.filter(
        (entry) =>
          entry.name.includes(".jpg") ||
          entry.name.includes(".png") ||
          entry.name.includes(".webp") ||
          entry.name.includes(".svg")
      );

      if (images.length > 0) {
        const avgImageLoadTime =
          images.reduce((sum, img) => sum + img.duration, 0) / images.length;
        this.metrics.imageLoadTime = avgImageLoadTime;

        console.log("🖼️ Image Load Performance:", {
          count: images.length,
          averageTime: `${avgImageLoadTime.toFixed(2)}ms`,
          slowestImage: images.reduce((slowest, current) =>
            current.duration > slowest.duration ? current : slowest
          ),
        });
      }
    });

    observer.observe({ entryTypes: ["resource"] });
    this.observers.push(observer);
  }

  private observeLargestContentfulPaint() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      console.log("🎯 Largest Contentful Paint:", {
        time: `${lastEntry.startTime.toFixed(2)}ms`,
        element: (lastEntry as any)?.element?.tagName || "Unknown",
      });
    });

    observer.observe({ entryTypes: ["largest-contentful-paint"] });
    this.observers.push(observer);
  }

  private observeFirstInputDelay() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0];

      console.log("⚡ First Input Delay:", {
        delay: `${
          (firstInput as any).processingStart - firstInput.startTime
        }ms`,
        duration: `${firstInput.duration}ms`,
      });
    });

    observer.observe({ entryTypes: ["first-input"] });
    this.observers.push(observer);
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  logSummary() {
    console.log("📈 Performance Summary:", {
      ...this.metrics,
      recommendations: this.getRecommendations(),
    });
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.loadTime && this.metrics.loadTime > 3000) {
      recommendations.push("Consider code splitting or lazy loading");
    }

    if (this.metrics.imageLoadTime && this.metrics.imageLoadTime > 500) {
      recommendations.push("Optimize image sizes and formats");
    }

    if (this.metrics.resourceCount && this.metrics.resourceCount > 50) {
      recommendations.push("Reduce number of HTTP requests");
    }

    return recommendations;
  }

  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Auto-initialize in production
if (import.meta.env.PROD) {
  const monitor = PerformanceMonitor.getInstance();
  monitor.init();

  // Log summary after 5 seconds
  setTimeout(() => {
    monitor.logSummary();
  }, 5000);
}
