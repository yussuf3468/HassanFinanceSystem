import type { ProductInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getProducts() {
  const response = await apiClient
    .from("products")
    .select(
      "id,name,product_id,category,buying_price,selling_price,quantity_in_stock,reorder_level,image_url,featured,published,created_at",
    )
    .order("created_at", { ascending: false });

  return unwrap(response, []);
}

export async function getPublicProducts() {
  const response = await apiClient
    .from("products")
    .select("*")
    .gt("quantity_in_stock", 0)
    .order("selling_price", { ascending: false })
    .order("name");

  return unwrap(response, []);
}

export async function getFeaturedProducts(limit: number = 8) {
  const response = await apiClient
    .from("products")
    .select("*")
    .gt("quantity_in_stock", 0)
    .order("selling_price", { ascending: false })
    .limit(limit);

  return unwrap(response, []);
}

export async function createProduct(payload: ProductInput) {
  const response = await apiClient.from("products").insert(payload).select().single();
  return unwrap(response, null);
}

export async function updateProduct(id: string, payload: ProductInput) {
  const response = await apiClient
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return unwrap(response, null);
}

export async function updateProductStock(id: string, quantityInStock: number) {
  const response = await apiClient
    .from("products")
    .update({ quantity_in_stock: quantityInStock })
    .eq("id", id);

  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const upload = await apiClient.storage
    .from("product-images")
    .upload(fileName, file);

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const { data } = apiClient.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
}
