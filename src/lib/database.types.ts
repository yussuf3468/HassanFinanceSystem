export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          category: string;
          image_url: string | null;
          buying_price: number;
          selling_price: number;
          quantity_in_stock: number;
          reorder_level: number;
          published: boolean;
          featured: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          category: string;
          image_url?: string | null;
          buying_price: number;
          selling_price: number;
          quantity_in_stock?: number;
          reorder_level?: number;
          published?: boolean;
          featured?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          category?: string;
          image_url?: string | null;
          buying_price?: number;
          selling_price?: number;
          quantity_in_stock?: number;
          reorder_level?: number;
          published?: boolean;
          featured?: boolean;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          customer_id?: string | null;
          order_number: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          delivery_address: string;
          delivery_fee: number;
          subtotal: number;
          total_amount: number;
          status:
            | "pending"
            | "confirmed"
            | "processing"
            | "delivered"
            | "cancelled";
          payment_method: "cash" | "mpesa" | "card" | "bank_transfer";
          payment_status: "pending" | "paid" | "failed" | "refunded";
          notes?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          order_number?: string;
          customer_name: string;
          customer_email?: string | null;
          customer_phone: string;
          delivery_address: string;
          delivery_fee?: number;
          subtotal?: number;
          total_amount: number;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "delivered"
            | "cancelled";
          payment_method?: "cash" | "mpesa" | "card" | "bank_transfer";
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          order_number?: string;
          customer_name?: string;
          customer_email?: string | null;
          customer_phone?: string;
          delivery_address?: string;
          delivery_fee?: number;
          subtotal?: number;
          total_amount?: number;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "delivered"
            | "cancelled";
          payment_method?: "cash" | "mpesa" | "card" | "bank_transfer";
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          product_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          product_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          product_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
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
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_date?: string;
          product_id: string;
          quantity_sold: number;
          selling_price: number;
          buying_price: number;
          total_sale: number;
          profit: number;
          payment_method: string;
          sold_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_date?: string;
          product_id?: string;
          quantity_sold?: number;
          selling_price?: number;
          buying_price?: number;
          total_sale?: number;
          profit?: number;
          payment_method?: string;
          sold_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
