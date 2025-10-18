// =====================================================
// SERVICE WORKER EMERGENCY CLEANUP SCRIPT
// =====================================================
// Copy and paste this ENTIRE script into your browser console (F12)
// This will forcefully remove the problematic service worker
// =====================================================

(async function cleanupServiceWorker() {
  console.log("🚨 Starting emergency service worker cleanup...");

  // Step 1: Unregister all service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();

    if (registrations.length === 0) {
      console.log("✅ No service workers found");
    } else {
      console.log(`⚠️ Found ${registrations.length} active service worker(s)`);

      for (const registration of registrations) {
        console.log("🗑️ Unregistering:", registration.scope);
        await registration.unregister();
        console.log("✅ Unregistered:", registration.scope);
      }
    }
  }

  // Step 2: Clear all caches
  const cacheNames = await caches.keys();

  if (cacheNames.length === 0) {
    console.log("✅ No caches found");
  } else {
    console.log(`⚠️ Found ${cacheNames.length} cache(s)`);

    for (const cacheName of cacheNames) {
      console.log("🗑️ Deleting cache:", cacheName);
      await caches.delete(cacheName);
      console.log("✅ Deleted cache:", cacheName);
    }
  }

  // Step 3: Clear storage
  console.log("🗑️ Clearing localStorage...");
  localStorage.clear();
  console.log("✅ localStorage cleared");

  console.log("🗑️ Clearing sessionStorage...");
  sessionStorage.clear();
  console.log("✅ sessionStorage cleared");

  // Step 4: Summary
  console.log("\n" + "=".repeat(50));
  console.log("✅ CLEANUP COMPLETE!");
  console.log("=".repeat(50));
  console.log("Service workers unregistered: ✅");
  console.log("Caches cleared: ✅");
  console.log("Storage cleared: ✅");
  console.log("\n🔄 Now refresh the page (Ctrl+R or F5)");
  console.log("The service worker errors should be GONE!");
  console.log("=".repeat(50) + "\n");
})();
