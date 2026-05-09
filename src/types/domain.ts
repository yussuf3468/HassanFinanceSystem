export interface ProductInput {
  product_id: string;
  name: string;
  category: string;
  image_url: string | null;
  buying_price: number;
  selling_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  description: string | null;
}

export interface DebtInput {
  lender: string;
  principal: number;
  interest_rate: number;
  started_on: string;
  due_on: string;
  notes?: string | null;
}

export interface DebtPaymentInput {
  debt_id: string;
  amount: number;
  paid_on: string;
  notes?: string | null;
}

export interface ExpenseInput {
  category_id: string | null;
  title: string;
  amount: number;
  incurred_on: string;
  notes?: string | null;
}

export interface InvestmentInput {
  source: string;
  amount: number;
  invested_on: string;
  notes?: string | null;
}

export interface CyberServiceInput {
  service_name: string;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface ReturnInput {
  sale_id?: string | null;
  product_id: string;
  quantity_returned: number;
  unit_price: number;
  total_refund: number;
  reason?: string | null;
  condition?: string | null;
  payment_method?: string | null;
  processed_by: string;
  notes?: string | null;
  status?: string;
}

export interface SaleInput {
  product_id: string;
  quantity_sold: number;
  selling_price: number;
  buying_price: number;
  total_sale: number;
  profit: number;
  payment_method: string;
  sold_by: string;
  sale_date?: string;
  original_price?: number;
  final_price?: number;
  discount_percentage?: number;
  discount_amount?: number;
  transaction_id?: string;
  customer_name?: string;
  payment_status?: string;
  amount_paid?: number;
}

export interface PaymentConfirmationInput {
  order_id: string;
  order_number: string;
  payment_reference: string;
  customer_phone: string;
  amount: number;
  receipt_code: string;
  status: "submitted" | "verified" | "rejected";
}
