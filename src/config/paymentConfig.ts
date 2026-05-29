export const MPESA_CONFIG = {
  paybillNumber: "REPLACE_WITH_PAYBILL",
  tillNumber: "REPLACE_WITH_TILL",
  businessName: "Hassan Bookshop",
  supportPhone: "+254 722 979 547",
  accountLabel: "Order Reference",
} as const;

export const PAYMENT_SECURITY = {
  receiptCodeMinLength: 6,
  receiptCodeMaxLength: 12,
} as const;
