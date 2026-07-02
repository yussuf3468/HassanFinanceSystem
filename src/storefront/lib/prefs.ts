import { useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════════════════════
   Tiny persistent stores (wishlist, recently viewed, recent
   searches) backed by localStorage + useSyncExternalStore so
   every component stays in sync without a provider.
   ═══════════════════════════════════════════════════════════════ */

function createListStore(key: string, maxItems: number) {
  let items: string[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed.filter((v) => typeof v === "string");
    }
  } catch {
    /* corrupted storage — start fresh */
  }

  const listeners = new Set<() => void>();

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* storage full/unavailable — stay in-memory */
    }
    listeners.forEach((fn) => fn());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): string[] {
      return items;
    },
    has(id: string) {
      return items.includes(id);
    },
    toggle(id: string): boolean {
      const present = items.includes(id);
      items = present ? items.filter((v) => v !== id) : [id, ...items];
      if (items.length > maxItems) items = items.slice(0, maxItems);
      persist();
      return !present;
    },
    /** Push to front (most-recent-first), dedupe, cap length. */
    push(id: string) {
      items = [id, ...items.filter((v) => v !== id)].slice(0, maxItems);
      persist();
    },
    remove(id: string) {
      items = items.filter((v) => v !== id);
      persist();
    },
    clear() {
      items = [];
      persist();
    },
  };
}

export const wishlistStore = createListStore("sf.wishlist", 100);
export const recentlyViewedStore = createListStore("sf.recently-viewed", 16);
export const recentSearchStore = createListStore("sf.recent-searches", 8);

export function useWishlist(): string[] {
  return useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot);
}

export function useRecentlyViewed(): string[] {
  return useSyncExternalStore(
    recentlyViewedStore.subscribe,
    recentlyViewedStore.getSnapshot,
  );
}

export function useRecentSearches(): string[] {
  return useSyncExternalStore(
    recentSearchStore.subscribe,
    recentSearchStore.getSnapshot,
  );
}
