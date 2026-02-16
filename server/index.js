import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const app = express();
const port = process.env.PAYMENT_API_PORT || 4000;

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"), false);
    },
  }),
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(apiLimiter);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl || "", supabaseServiceKey || "", {
  auth: { persistSession: false },
});

const confirmSchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(3).max(32),
  paymentReference: z.string().min(3).max(64),
  customerPhone: z.string().min(6).max(20),
  amount: z.number().positive(),
  receiptCode: z.string().min(6).max(12),
  paymentChannel: z.enum(["mpesa_paybill", "mpesa_till"]).optional(),
});

const verifySchema = z.object({
  orderId: z.string().uuid(),
  receiptCode: z.string().min(6).max(12),
  status: z.enum(["verified", "rejected"]),
  adminNote: z.string().max(300).optional(),
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/payments/confirm", async (req, res) => {
  try {
    const parsed = confirmSchema.parse(req.body);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_phone, total_amount")
      .eq("id", parsed.orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (
      order.order_number !== parsed.orderNumber ||
      order.customer_phone !== parsed.customerPhone ||
      Number(order.total_amount) !== Number(parsed.amount)
    ) {
      return res.status(400).json({ error: "Order details do not match" });
    }

    const { data: existing, error: receiptError } = await supabase
      .from("payment_confirmations")
      .select("id")
      .eq("receipt_code", parsed.receiptCode)
      .maybeSingle();

    if (receiptError) {
      return res.status(500).json({ error: "Receipt lookup failed" });
    }

    if (existing) {
      return res.status(409).json({ error: "Receipt code already used" });
    }

    const { error: insertError } = await supabase
      .from("payment_confirmations")
      .insert([
        {
          order_id: parsed.orderId,
          order_number: parsed.orderNumber,
          payment_reference: parsed.paymentReference,
          customer_phone: parsed.customerPhone,
          amount: parsed.amount,
          receipt_code: parsed.receiptCode,
          status: "submitted",
          raw_data: {
            paymentChannel: parsed.paymentChannel || "mpesa_paybill",
          },
        },
      ]);

    if (insertError) {
      return res.status(500).json({ error: "Failed to submit receipt" });
    }

    await supabase
      .from("orders")
      .update({
        payment_submitted_at: new Date().toISOString(),
        payment_receipt_code: parsed.receiptCode,
        payment_phone: parsed.customerPhone,
        payment_amount: parsed.amount,
        payment_channel: parsed.paymentChannel || "mpesa_paybill",
      })
      .eq("id", parsed.orderId);

    return res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: err.errors });
    }
    console.error("Payment confirm error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/payments/verify", async (req, res) => {
  try {
    const adminToken = req.header("x-admin-token");
    if (!adminToken || adminToken !== process.env.ADMIN_API_TOKEN) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = verifySchema.parse(req.body);

    const { error: updateConfirmError } = await supabase
      .from("payment_confirmations")
      .update({
        status: parsed.status,
        verified_at: new Date().toISOString(),
        verified_by: "admin",
      })
      .eq("receipt_code", parsed.receiptCode)
      .eq("order_id", parsed.orderId);

    if (updateConfirmError) {
      return res.status(500).json({ error: "Failed to update confirmation" });
    }

    const orderUpdate =
      parsed.status === "verified"
        ? {
            payment_status: "paid",
            payment_verified_at: new Date().toISOString(),
            status: "confirmed",
          }
        : {
            payment_status: "failed",
          };

    await supabase.from("orders").update(orderUpdate).eq("id", parsed.orderId);

    return res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid request", details: err.errors });
    }
    console.error("Payment verify error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Payment API running on port ${port}`);
});
