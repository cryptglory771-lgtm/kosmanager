-- Migration 003: Tambah kolom pembayaran Midtrans ke invoices
-- Jalankan di: Supabase Dashboard → SQL Editor

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_url      TEXT,
  ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMPTZ;

-- Index untuk pencarian webhook berdasarkan order_id
CREATE INDEX IF NOT EXISTS idx_invoices_payment_order_id
  ON invoices (payment_order_id)
  WHERE payment_order_id IS NOT NULL;
