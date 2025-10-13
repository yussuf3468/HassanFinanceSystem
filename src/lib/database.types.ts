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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: string | null;
          last_login: string | null;
          created_at: string | null;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          last_login?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: string | null;
          last_login?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
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
      expense_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          category_id: string | null;
          title: string;
          amount: number;
          incurred_on: string; // date
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title: string;
          amount: number;
          incurred_on?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          title?: string;
          amount?: number;
          incurred_on?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      initial_investments: {
        Row: {
          id: string;
          source: string;
          amount: number;
          invested_on: string; // date
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          amount: number;
          invested_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          amount?: number;
          invested_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          id: string;
          lender: string;
          principal: number;
          interest_rate: number | null;
          started_on: string; // date
          due_on: string | null; // date
          status: "active" | "closed" | "defaulted";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lender: string;
          principal: number;
          interest_rate?: number | null;
          started_on?: string;
          due_on?: string | null;
          status?: "active" | "closed" | "defaulted";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lender?: string;
          principal?: number;
          interest_rate?: number | null;
          started_on?: string;
          due_on?: string | null;
          status?: "active" | "closed" | "defaulted";
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      debt_payments: {
        Row: {
          id: string;
          debt_id: string;
          amount: number;
          paid_on: string; // date
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          debt_id: string;
          amount: number;
          paid_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          debt_id?: string;
          amount?: number;
          paid_on?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      vw_today_revenue_profit: {
        Row: { today_revenue: number; today_profit: number };
        Relationships: [];
      };
      vw_monthly_profit: {
        Row: { monthly_profit: number };
        Relationships: [];
      };
      vw_net_worth: {
        Row: { net_worth: number };
        Relationships: [];
      };
      vw_outstanding_debt: {
        Row: { outstanding_debt: number };
        Relationships: [];
      };
      vw_debts_with_balance: {
        Row: {
          id: string;
          lender: string;
          principal: number;
          interest_rate: number | null;
          started_on: string;
          due_on: string | null;
          status: "active" | "closed" | "defaulted";
          notes: string | null;
          created_at: string;
          total_paid: number;
          outstanding: number;
        };
        Relationships: [];
      };
      vw_monthly_expenses: {
        Row: { ym: string; month: string; total: number };
        Relationships: [];
      };
      vw_monthly_investments: {
        Row: { ym: string; month: string; total: number };
        Relationships: [];
      };
      vw_expense_by_category_month: {
        Row: { category: string | null; total: number };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
