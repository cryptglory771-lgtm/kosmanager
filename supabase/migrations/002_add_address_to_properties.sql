-- Migration 002: Tambah kolom address ke properties
-- Jalankan di: Supabase Dashboard → SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS address TEXT;
