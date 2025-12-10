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
  published?: boolean;
  featured?: boolean;
  description: string | null;
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

// E-commerce Types
export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id?: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  delivery_address: string;
  delivery_fee: number;
  subtotal: number;
  total_amount: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  payment_method: "cash" | "mpesa" | "card" | "bank_transfer";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product?: Product })[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

export interface CheckoutForm {
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  email?: string;
  notes?: string;
}
