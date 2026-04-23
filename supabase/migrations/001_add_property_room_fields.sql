-- ============================================================
-- Migration 001: Tambah field jenis_kos & fasilitas ke properties
--                Tambah field tipe_kamar & fasilitas ke rooms
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. PROPERTIES: jenis_kos
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS jenis_kos TEXT NOT NULL DEFAULT 'campur'
    CHECK (jenis_kos IN ('putra', 'putri', 'campur'));

-- 2. PROPERTIES: fasilitas (jsonb dengan default semua false)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS fasilitas JSONB NOT NULL DEFAULT '{
    "wifi": false,
    "parkir_motor": false,
    "parkir_mobil": false,
    "dapur_bersama": false,
    "laundry": false,
    "security_24jam": false,
    "cctv": false,
    "musholla": false,
    "kolam_renang": false
  }'::jsonb;

-- 3. ROOMS: tipe_kamar
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS tipe_kamar TEXT NOT NULL DEFAULT 'Standar';

-- 4. ROOMS: fasilitas (jsonb dengan default semua false)
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS fasilitas JSONB NOT NULL DEFAULT '{
    "ac": false,
    "kamar_mandi_dalam": false,
    "kulkas": false,
    "tv": false,
    "meja_belajar": false,
    "lemari": false,
    "kasur": false,
    "jendela": false,
    "balkon": false
  }'::jsonb;
