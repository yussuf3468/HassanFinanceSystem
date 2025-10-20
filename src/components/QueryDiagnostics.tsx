import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function QueryDiagnostics() {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    queries: 0,
    observers: 0,
  });

  useEffect(() => {
    if (import.meta.env.PROD) return;

    let timeoutId: NodeJS.Timeout;
    let lastStats = stats;

    const update = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const queries = queryClient.getQueryCache().getAll();
        const observers = queries.reduce(
          (sum, q: any) => sum + q.observers.length,
          0
        );
        // Only update state if values changed
        if (
          lastStats.queries !== queries.length ||
          lastStats.observers !== observers
        ) {
          lastStats = { queries: queries.length, observers };
          setStats(lastStats);
        }
      }, 0);
    };

    const unsub = queryClient.getQueryCache().subscribe(update);
    update();

    return () => {
      clearTimeout(timeoutId);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  if (import.meta.env.PROD) return null;

  return (
    <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999 }}>
      <div
        style={{
          background: "rgba(2,6,23,0.8)",
          color: "#fff",
          padding: "8px 10px",
          borderRadius: 8,
          fontSize: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
          backdropFilter: "blur(6px)",
        }}
      >
        <strong>RQ</strong> q:{stats.queries} obs:{stats.observers}
      </div>
    </div>
  );
}
