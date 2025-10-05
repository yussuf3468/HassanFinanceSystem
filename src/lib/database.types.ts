export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          product_id: string
          name: string
          category: string
          image_url: string | null
          buying_price: number
          selling_price: number
          quantity_in_stock: number
          reorder_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          category: string
          image_url?: string | null
          buying_price: number
          selling_price: number
          quantity_in_stock?: number
          reorder_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          category?: string
          image_url?: string | null
          buying_price?: number
          selling_price?: number
          quantity_in_stock?: number
          reorder_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          sale_date: string
          product_id: string
          quantity_sold: number
          selling_price: number
          buying_price: number
          total_sale: number
          profit: number
          payment_method: string
          sold_by: string
          created_at: string
        }
        Insert: {
          id?: string
          sale_date?: string
          product_id: string
          quantity_sold: number
          selling_price: number
          buying_price: number
          total_sale: number
          profit: number
          payment_method: string
          sold_by: string
          created_at?: string
        }
        Update: {
          id?: string
          sale_date?: string
          product_id?: string
          quantity_sold?: number
          selling_price?: number
          buying_price?: number
          total_sale?: number
          profit?: number
          payment_method?: string
          sold_by?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
