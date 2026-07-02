import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

/* ═══════════════════════════════════════════════════════════════
   Minimal hash router. Keeps URLs shareable (#/products?cat=books)
   without adding a routing dependency to the bundle.
   ═══════════════════════════════════════════════════════════════ */

export interface Route {
  /** Path portion, e.g. "/products" or "/product/abc123". */
  path: string;
  segments: string[];
  query: URLSearchParams;
}

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart = ""] = raw.split("?");
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return {
    path,
    segments: path.split("/").filter(Boolean),
    query: new URLSearchParams(queryPart),
  };
}

export function navigate(to: string, options?: { replace?: boolean }) {
  const hash = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`;
  if (options?.replace) {
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = hash;
  }
}

const RouteContext = createContext<Route | null>(null);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  // New page → scroll to top (drawers/overlays are unaffected).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [route.path]);

  return <RouteContext.Provider value={route}>{children}</RouteContext.Provider>;
}

export function useRoute(): Route {
  const route = useContext(RouteContext);
  if (!route) throw new Error("useRoute must be used inside RouteProvider");
  return route;
}

/** Update query params on the current path (replaces history entry). */
export function useQueryState() {
  const route = useRoute();
  const setQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.hash.split("?")[1] || "");
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      navigate(`${route.path}${qs ? `?${qs}` : ""}`, { replace: true });
    },
    [route.path],
  );
  return useMemo(() => ({ query: route.query, setQuery }), [route.query, setQuery]);
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const href = `#${to.startsWith("/") ? to : `/${to}`}`;
  return (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
