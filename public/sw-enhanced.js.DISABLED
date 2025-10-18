// Enhanced Service Worker for Cache Management with Image Cache Busting
const CACHE_NAME = "lenzro-erp-v1";
const IMAGE_CACHE_NAME = "lenzro-erp-images-v1";

// Install event - cache core assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing enhanced version...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching core assets...");
      // Precache minimal shell; Vite assets are fingerprinted and cached on demand
      return cache.addAll(["/", "/index.html"]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating enhanced version...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests with cache-busting for images
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip Supabase API requests
  if (event.request.url.includes("supabase.co")) {
    return;
  }

  const url = new URL(event.request.url);

  // Check if it's an image request
  if (
    event.request.destination === "image" ||
    /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url.pathname)
  ) {
    event.respondWith(handleImageRequest(event.request));
  } else {
    // For non-image requests, use default strategy
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();
        return fetch(fetchRequest)
          .then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            if (event.request.destination === "document") {
              return caches.match("/index.html");
            }
          });
      })
    );
  }
});

// Handle image requests with fresh fetching strategy
async function handleImageRequest(request) {
  const url = new URL(request.url);

  // Always fetch fresh if URL has cache-busting parameters
  if (url.searchParams.has("_t") || url.searchParams.has("_v")) {
    console.log("Service Worker: Fetching fresh image:", url.pathname);
    try {
      const response = await fetch(request, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      return response;
    } catch (error) {
      console.log(
        "Service Worker: Failed to fetch fresh image, trying cache..."
      );
      return caches.match(request);
    }
  }

  // For images without cache-busting, always fetch fresh to avoid old cached images
  try {
    console.log(
      "Service Worker: Fetching fresh image (no cache):",
      url.pathname
    );
    const response = await fetch(request, {
      cache: "no-cache",
    });

    return response;
  } catch (error) {
    // Return cached version as fallback
    console.log("Service Worker: Network failed, trying cache...");
    return caches.match(request);
  }
}

// Message handler for cache management
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_IMAGE_CACHE") {
    event.waitUntil(
      caches.delete(IMAGE_CACHE_NAME).then(() => {
        console.log("Service Worker: Image cache cleared");
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === "FORCE_REFRESH_IMAGES") {
    event.waitUntil(
      clearImageCacheAndRefresh().then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Clear image cache and force refresh
async function clearImageCacheAndRefresh() {
  await caches.delete(IMAGE_CACHE_NAME);
  console.log("Service Worker: Forced image cache refresh");

  // Send message to clients to refresh images
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "IMAGES_CACHE_CLEARED" });
  });
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("Service Worker: Background sync triggered");
  // Handle offline cart updates, etc.
}
