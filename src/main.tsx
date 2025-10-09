import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index_new.css";

// Import performance monitoring
import "./utils/performance";

// Import cache manager for automatic image refresh
import "./utils/cacheManager";

// Register enhanced service worker for caching and image cache-busting
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
