import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index_new.css";

// Import performance monitoring
import "./utils/performance";

// ❌ DISABLED: Cache manager conflicts with React Query infinite cache
// import "./utils/cacheManager";

// Create React Query client with MAXIMUM caching (reduce egress by 1000%)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data NEVER goes stale - cache forever!
      gcTime: Infinity, // NEVER garbage collect - keep in memory forever!
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // Don't refetch on component mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 0, // Don't retry failed requests (saves bandwidth)
    },
  },
});

// ❌ DISABLED: Service Worker was forcing EVERY image to fetch fresh (cache: "no-cache")
// This caused 24,241 storage requests in 24 hours! (17 requests per minute!)
// Root cause: sw-enhanced.js lines 117-125 bypass cache for all images
// Solution: Unregister service worker and rely on browser cache + React Query
/*
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw-enhanced.js")
      .then((registration) => {
        console.log(
          "Enhanced Service Worker registered successfully:",
          registration.scope
        );

        // Force immediate activation
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("New service worker installed, forcing refresh...");
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log("Enhanced Service Worker registration failed:", error);
      });
  });

  // Listen for service worker messages
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "IMAGES_CACHE_CLEARED") {
      console.log("Images cache cleared, refreshing...");
      // Force a hard refresh of all images
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        const src = img.src;
        img.src = "";
        img.src =
          src + (src.includes("?") ? "&" : "?") + "_refresh=" + Date.now();
      });
    }
  });
}
*/

// 🧹 CLEANUP: Unregister existing service workers
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log("🗑️ Unregistered problematic service worker");
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
