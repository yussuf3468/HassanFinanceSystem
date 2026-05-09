import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  getPublicProducts,
  getFeaturedProducts,
} from "../../../api/productsApi";

export function useProductsFeature() {
  return useQuery({
    queryKey: ["feature-products"],
    queryFn: getProducts,
  });
}

export function usePublicProductsFeature() {
  return useQuery({
    queryKey: ["feature-products-public"],
    queryFn: getPublicProducts,
  });
}

export function useFeaturedProductsFeature(limit = 8) {
  return useQuery({
    queryKey: ["feature-products-featured", limit],
    queryFn: () => getFeaturedProducts(limit),
  });
}
