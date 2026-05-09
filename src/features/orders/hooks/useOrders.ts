import { useQuery } from "@tanstack/react-query";
import { getOrders, getPendingOrdersCount } from "../../../api/ordersApi";

export function useOrdersFeature() {
  return useQuery({
    queryKey: ["feature-orders"],
    queryFn: getOrders,
  });
}

export function usePendingOrdersCountFeature() {
  return useQuery({
    queryKey: ["feature-orders-pending-count"],
    queryFn: getPendingOrdersCount,
  });
}
