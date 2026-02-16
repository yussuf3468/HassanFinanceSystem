import { useState } from "react";

// Simple hook to track location (replace with actual router if available)
export function useLocation() {
  const [pathname] = useState(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  return { pathname };
}
