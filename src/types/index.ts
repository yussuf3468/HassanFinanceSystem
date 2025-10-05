export interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string;
  image_url: string | null;
  buying_price: number;
  selling_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  sale_date: string;
  product_id: string;
  quantity_sold: number;
  selling_price: number;
  buying_price: number;
  total_sale: number;
  profit: number;
  payment_method: string;
  sold_by: string;
  discount_amount?: number;
  discount_percentage?: number;
  original_price?: number;
  final_price?: number;
  created_at: string;
}

export interface SaleWithProduct extends Sale {
  product?: Product;
}

export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  lowStockCount: number;
  totalProducts: number;
}

export interface ProductStats {
  product: Product;
  totalSales: number;
  totalProfit: number;
  totalQuantitySold: number;
}
