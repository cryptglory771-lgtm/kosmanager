# KosManager — Checklist Perbaikan

---

## 1. Paket & Tier Langganan

### 1.1 Definisi Tier
- [ ] Tentukan batas fitur per tier:
  - **Gratis**: maks 1 properti, maks 10 kamar, notifikasi WA manual saja, tanpa laporan
  - **Starter**: maks 3 properti, maks 30 kamar, notifikasi WA otomatis, laporan dasar
  - **Pro**: properti & kamar unlimited, semua fitur, laporan lengkap, export PDF/CSV
- [ ] Buat tabel `plans` di Supabase (id, name, max_properties, max_rooms, features jsonb, price_monthly, price_yearly)
- [ ] Buat tabel `subscriptions` di Supabase (id, owner_id, plan_id, status, current_period_end, midtrans_subscription_id)
- [ ] Tambahkan RLS policy untuk `plans` dan `subscriptions`

### 1.2 Halaman Pricing
- [ ] Buat `/pricing` page dengan tabel perbandingan 3 tier
- [ ] Tambahkan toggle billing bulanan / tahunan (diskon 20% tahunan)
- [ ] Tambahkan CTA "Mulai Gratis" dan "Upgrade" per tier
- [ ] Tambahkan link ke `/pricing` dari landing page dan dashboard sidebar

### 1.3 Middleware & Gate Fitur
- [ ] Buat helper `checkPlanLimit(ownerId, resource)` di `lib/plans.ts`
- [ ] Block tambah properti/kamar jika melebihi batas tier
- [ ] Tampilkan banner upgrade di dashboard jika approaching limit (>80%)
- [ ] Disable fitur premium (laporan, cron otomatis) untuk tier Gratis
- [ ] Redirect ke `/pricing` dengan pesan saat mencoba akses fitur terkunci

### 1.4 Integrasi Pembayaran (Midtrans)
- [ ] Buat `/api/billing/create-transaction` untuk membuat transaksi Midtrans Snap
- [ ] Buat `/api/billing/webhook` untuk menerima notifikasi status bayar Midtrans
- [ ] Update `subscriptions` otomatis saat webhook diterima (active/expired)
- [ ] Buat `/dashboard/billing` page: status paket, tanggal expired, riwayat pembayaran, tombol upgrade/renew
- [ ] Handle expired subscription: turunkan ke Gratis otomatis, tampilkan notifikasi

---

## 2. Konfigurasi Website via Environment

### 2.1 Variabel Baru di `.env.local`
- [ ] Tambahkan:
  ```
  NEXT_PUBLIC_SITE_NAME=KosManager
  NEXT_PUBLIC_SITE_TAGLINE=Kelola kos lebih cerdas
  NEXT_PUBLIC_SITE_URL=https://kosmanager-two.vercel.app
  NEXT_PUBLIC_SUPPORT_WA=628xxxxxxxxxx
  NEXT_PUBLIC_SUPPORT_EMAIL=support@kosmanager.app
  ```
- [ ] Buat `lib/config.ts` yang mengekspos semua variabel site dengan fallback default
- [ ] Ganti semua hardcoded nama/URL di codebase dengan referensi ke `lib/config.ts`

### 2.2 Metadata Global
- [ ] Buat `app/layout.tsx` dengan `generateMetadata()` menggunakan variabel env
- [ ] Pasang Open Graph tags (title, description, image, url)
- [ ] Pasang Twitter Card tags
- [ ] Buat `public/og-image.png` (1200×630) sebagai default OG image

---

## 3. Landing Page SEO-Friendly

### 3.1 Metadata & Tags
- [ ] Tambahkan `export const metadata` di `app/landing/page.tsx`:
  - `title`: "KosManager — Kelola Kos Lebih Cerdas & Otomatis"
  - `description`: deskripsi 150-160 karakter mengandung keyword utama
  - `keywords`: kos, manajemen kos, tagihan kos otomatis, aplikasi kos Indonesia
  - `canonical`: URL produksi
- [ ] Tambahkan Open Graph dan Twitter Card metadata
- [ ] Tambahkan `alternates.canonical`

### 3.2 Struktur HTML Semantik
- [ ] Pastikan hanya ada 1 tag `<h1>` di halaman landing
- [ ] Gunakan heading hierarki yang benar: h1 → h2 → h3
- [ ] Tambahkan `aria-label` pada semua tombol ikon
- [ ] Bungkus section dengan tag semantik: `<header>`, `<main>`, `<section>`, `<footer>`
- [ ] Tambahkan `alt` text deskriptif pada semua gambar/ilustrasi

### 3.3 Performa (Core Web Vitals)
- [ ] Konversi gambar ke format WebP
- [ ] Gunakan `next/image` untuk semua gambar dengan `priority` pada hero image
- [ ] Lazy load section bawah dengan `loading="lazy"`
- [ ] Cek dan perbaiki LCP, CLS, FID menggunakan Vercel Speed Insights atau PageSpeed

### 3.4 Schema Markup
- [ ] Tambahkan JSON-LD `Organization` schema di `<head>`
- [ ] Tambahkan JSON-LD `SoftwareApplication` schema
- [ ] Tambahkan FAQ schema untuk section FAQ (buat section FAQ jika belum ada)

### 3.5 Konten
- [ ] Buat section FAQ minimal 5 pertanyaan umum tentang KosManager
- [ ] Tambahkan section "Cara Kerja" dengan 3 langkah (Daftar → Setup → Otomatisasi)
- [ ] Pastikan semua teks CTA mengandung keyword yang relevan
- [ ] Buat `public/sitemap.xml` atau aktifkan `next-sitemap`
- [ ] Buat `public/robots.txt`

---

## 4. Pembaruan Struktur Database

### 4.1 Tabel `properties` — Tambahan Field
- [ ] Tambahkan kolom `jenis_kos` (enum: `'putra'`, `'putri'`, `'campur'`) — default `'campur'`
- [ ] Tambahkan kolom `fasilitas` (jsonb) — contoh:
  ```json
  {
    "parkir_motor": true,
    "parkir_mobil": false,
    "wifi": true,
    "dapur_bersama": true,
    "laundry": false,
    "security_24jam": false,
    "cctv": true,
    "musholla": false
  }
  ```
- [ ] Buat migration SQL di Supabase
- [ ] Update RLS policy jika diperlukan

### 4.2 Tabel `rooms` — Tambahan Field
- [ ] Tambahkan kolom `tipe_kamar` (varchar) — contoh: `'Standar'`, `'Premier'`, `'Deluxe'`, `'Suite'`
- [ ] Tambahkan kolom `fasilitas` (jsonb) — contoh:
  ```json
  {
    "kamar_mandi_dalam": false,
    "ac": false,
    "kulkas": false,
    "tv": false,
    "meja_belajar": true,
    "lemari": true,
    "kasur": true,
    "jendela": true
  }
  ```
- [ ] Buat migration SQL di Supabase
- [ ] Update RLS policy jika diperlukan

### 4.3 Update UI — Form Properti (Onboarding & Dashboard)
- [ ] Tambahkan field `jenis_kos` (radio button: Putra / Putri / Campur) di form properti
- [ ] Tambahkan checklist fasilitas properti di form properti
- [ ] Update `app/onboarding/page.tsx` Step 2
- [ ] Buat/update halaman edit properti di dashboard

### 4.4 Update UI — Form Kamar
- [ ] Tambahkan field `tipe_kamar` (dropdown/select) di form tambah/edit kamar
- [ ] Tambahkan checklist fasilitas kamar (AC, Kulkas, KM Dalam, dll.)
- [ ] Update `app/dashboard/rooms/page.tsx` (form tambah & edit)
- [ ] Update `app/onboarding/page.tsx` Step 3 jika perlu

### 4.5 Update UI — Tampilan Kamar
- [ ] Tampilkan badge tipe kamar di card kamar dashboard
- [ ] Tampilkan ikon fasilitas (AC ❄️, Kulkas 🧊, KM Dalam 🚿) di card kamar
- [ ] Tampilkan jenis kos dan fasilitas di halaman detail properti
- [ ] Update halaman publik `/pay/[invoiceId]` jika relevan menampilkan tipe kamar

---

## Urutan Pengerjaan yang Disarankan

```
[Prioritas Tinggi]
4.1 → 4.2   DB migration dulu sebelum UI
4.3 → 4.4   Update form setelah DB siap
2.1 → 2.2   Config env (cepat, unlocks banyak hal lain)
3.1 → 3.5   SEO landing page

[Prioritas Menengah]
1.1 → 1.3   Definisi tier + gate fitur

[Prioritas Rendah / Setelah Revenue]
1.4         Midtrans billing integration
```
