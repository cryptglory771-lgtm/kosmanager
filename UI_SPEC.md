# KostzyApp — UI Specification for Claude Code

> **Cara pakai:** Simpan file ini sebagai `UI_SPEC.md` di root project.
> Saat mulai build UI, katakan ke Claude Code:
> _"Baca UI_SPEC.md dan buat [nama halaman] sesuai spesifikasi."_

---

## MASTER PROMPT (copy-paste ke Claude Code)

```
Kamu adalah frontend engineer yang membangun KostzyApp — SaaS manajemen kos Indonesia.

Baca UI_SPEC.md dan ikuti SEMUA aturan desain secara ketat:
- Design system: warna, font, spacing, komponen
- Setiap halaman memiliki spesifikasi lengkap di file ini
- WAJIB mobile-first: semua halaman harus responsif di HP (375px)
- Gunakan Tailwind CSS untuk styling
- Gunakan shadcn/ui untuk komponen dasar
- Semua teks dalam Bahasa Indonesia
- Tidak ada placeholder lorem ipsum — gunakan data dummy realistis

Sebelum mulai coding, konfirmasi: halaman apa yang akan dibuat?
```

---

## 1. DESIGN SYSTEM

### 1.1 Color Palette

```css
/* Wajib didefinisikan di tailwind.config.ts */
colors: {
  green: {
    50:  '#F0FDF7',
    100: '#D4F7EB',
    200: '#A7EDD0',
    400: '#34C88A',
    600: '#138A5F',
    700: '#0F6E4C',
    800: '#0B4D35',  /* PRIMARY — dipakai paling banyak */
    900: '#052E1A',
  },
  cream: {
    DEFAULT: '#FAFAF5',
    dark:    '#F2F0E8',
  },
  amber: {
    DEFAULT: '#F59E0B',
    light:   '#FEF3C7',
    soft:    '#FDE68A',
  },
}
```

**Aturan penggunaan warna:**

- `green-800` = primary actions, header, tombol utama
- `green-50/100` = background card sukses / badge aktif
- `amber` = warning, tagihan hampir jatuh tempo, badge populer
- `red-100/red-600` = error, tagihan terlambat, kamar kosong
- `cream` = background halaman utama (BUKAN putih murni)
- Teks utama: `gray-900` (#1C1917)
- Teks sekunder: `gray-500` (#78716C)

---

### 1.2 Typography

```bash
# Install font di project
npm install next/font
```

```tsx
// app/layout.tsx
import { Fraunces } from "next/font/google";
import { Plus_Jakarta_Sans } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});
```

**Aturan font:**

- `font-display` (Fraunces) = heading halaman, angka besar, logo
- `font-body` (Plus Jakarta Sans) = semua teks UI, label, tombol
- Heading di halaman: `font-display font-black tracking-tight`
- Label form: `font-body font-bold text-[10px] uppercase tracking-wider text-gray-500`

---

### 1.3 Spacing & Radius

```
Padding halaman mobile  : px-4 (16px)
Padding halaman desktop : px-8 md:px-12 lg:px-16
Gap antar card          : gap-3 (12px)
Padding dalam card      : p-4 (16px)

Border radius:
- Input, badge kecil  : rounded-xl  (12px)
- Card               : rounded-2xl (16px)
- Modal, bottom sheet: rounded-3xl (24px)
- Tombol             : rounded-xl  (12px)
- Avatar bulat       : rounded-full
```

---

### 1.4 Shadow

```
Card biasa    : shadow-sm border border-gray-200
Card hover    : shadow-md border border-green-200
Card featured : shadow-xl shadow-green-900/20
```

---

### 1.5 Komponen Dasar (wajib konsisten)

#### Tombol Primary

```tsx
<button
  className="
  bg-green-800 text-white font-bold text-sm
  px-5 py-2.5 rounded-xl
  hover:bg-green-700 active:scale-[0.98]
  transition-all duration-150
  flex items-center gap-2
"
>
  Label Tombol
</button>
```

#### Tombol Outline

```tsx
<button
  className="
  border-2 border-green-800 text-green-800 font-bold text-sm
  px-5 py-2.5 rounded-xl bg-white
  hover:bg-green-50 active:scale-[0.98]
  transition-all duration-150
"
>
  Label Tombol
</button>
```

#### Input Form

```tsx
<div>
  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
    LABEL FIELD
  </label>
  <input
    className="
    w-full px-3.5 py-2.5
    border-2 border-gray-200 rounded-xl
    font-body text-sm text-gray-900
    focus:border-green-600 focus:outline-none
    bg-white transition-colors
  "
    placeholder="Contoh..."
  />
  <p className="text-[10px] text-gray-400 mt-1">Hint teks di sini</p>
</div>
```

#### Badge Status

```tsx
// Lunas
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Lunas</span>

// Belum bayar
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Belum</span>

// Hampir jatuh tempo
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-light text-amber-700">3 hari lagi</span>

// Kosong (kamar)
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Kosong</span>
```

#### Card Avatar Inisial

```tsx
<div
  className="
  w-10 h-10 rounded-xl flex-shrink-0
  flex items-center justify-content-center
  text-sm font-bold
  bg-green-100 text-green-800
"
>
  BS
</div>
```

---

## 2. LAYOUT SISTEM

### 2.1 Shell Aplikasi (setelah login)

```
┌─────────────────────────────────┐
│  Top Nav (mobile) / Sidebar     │
│  - Logo KostzyApp               │
│  - Menu navigasi                │
├─────────────────────────────────┤
│                                 │
│  CONTENT AREA                   │
│  max-w-screen-xl mx-auto        │
│                                 │
└─────────────────────────────────┘
│  Bottom Nav (mobile only)       │
│  [🏠 Beranda] [🚪 Kamar]       │
│  [💰 Tagihan] [👤 Profil]      │
└─────────────────────────────────┘
```

**Bottom navigation (mobile, sticky):**

```tsx
// Tampil hanya di bawah md breakpoint
// 4 item: Beranda, Kamar, Tagihan, Profil
// Item aktif: icon + label berwarna green-800, dot indicator
// Item nonaktif: gray-400
```

**Sidebar (desktop, md ke atas):**

```
Lebar: 240px, fixed
Background: green-900
Logo di atas
Menu items dengan icon
Footer: nama user + logout
```

---

### 2.2 Responsive Breakpoints

```
Mobile first approach:
- Default (< 768px) : layout 1 kolom, bottom nav
- md (768px+)       : sidebar muncul, bottom nav hilang
- lg (1024px+)      : grid 2-3 kolom untuk card
- xl (1280px+)      : max-width container
```

---

## 3. SPESIFIKASI HALAMAN

---

### 3.1 Halaman Login (`/login`)

**Layout:** Full screen, centered, background cream dengan blob dekorasi hijau

**Komponen:**

```
┌─────────────────────────┐
│  Logo KostzyApp (center)│
│                         │
│  "Masuk ke akun kamu"   │  ← font-display, 24px
│  "Login pakai nomor HP" │  ← text-sm text-gray-500
│                         │
│  [Input Nomor HP]       │  ← placeholder: 0812-xxxx-xxxx
│  [Tombol Kirim OTP]     │  ← btn primary full width
│                         │
│  ── atau ──             │
│                         │
│  [Masuk dengan Google]  │  ← btn outline full width
│                         │
│  "Belum punya akun?"    │
│  [Daftar Gratis]        │
└─────────────────────────┘
```

**State OTP (setelah nomor disubmit):**

```
┌─────────────────────────┐
│  "Kode dikirim ke"      │
│  0812-xxxx-xxxx  [Ubah] │
│                         │
│  [_] [_] [_] [_] [_] [_]│  ← 6 digit OTP input terpisah
│                         │
│  [Verifikasi]           │
│  "Kirim ulang (30d)"    │
└─────────────────────────┘
```

**Aturan:**

- Input OTP: 6 box terpisah, auto-focus ke box berikutnya
- Countdown timer 30 detik untuk kirim ulang
- Error state: border merah + teks error di bawah

---

### 3.2 Halaman Onboarding (`/onboarding`)

**3 langkah dengan step indicator di atas:**

```
[ 1 Data Kos ]──[ 2 Kamar ]──[ 3 Selesai ]
      ↑ (aktif)
```

**Step 1 — Data kos:**

```
Nama kos*        : [________________]
Alamat           : [________________]
Nomor WA kamu*   : [________________]
                   (notifikasi dikirim ke sini)

[Lanjut →]
```

**Step 2 — Setup kamar:**

```
"Berapa kamar di kos kamu?"
[  -  ] [ 12 ] [  +  ]   ← counter input

Harga sewa default/bulan:
[Rp _______________]

Tanggal tagihan tiap bulan:
[Pilih tanggal ▼]  ← dropdown 1-28

[← Kembali]  [Lanjut →]
```

**Step 3 — Selesai:**

```
✅ (icon centang besar, animated)

"Kos Melati Indah siap!"
"12 kamar · Tagihan tiap tgl 1"

[🏠 Mulai Kelola Kos]  ← redirect ke dashboard
```

---

### 3.3 Dashboard Beranda (`/dashboard`)

**Header section (background green-800):**

```
Selamat pagi,           [🔔 notif]
Bu Sari ☀️

┌────────────┬──────────┬───────────┐
│ 12         │ 10       │ Rp 7,8jt  │
│ Total kamar│ Terisi   │ Bulan ini │
└────────────┴──────────┴───────────┘
```

**Alert card (jika ada tagihan belum bayar):**

```
⚠️ 3 tagihan belum dibayar
   Jatuh tempo dalam 3 hari
   [Kirim Reminder →]          ← amber background
```

**Grid status kamar:**

```
Status kamar             [Lihat semua →]

● Terisi  ● Kosong  ● Habis kontrak  ← legenda

[1A] [1B] [1C] [1D]
[2A] [2B] [2C] [2D]
  ↑    ↑    ↑    ↑
hijau hijau kuning merah
```

**Spesifikasi tile kamar:**

- Ukuran: aspect-ratio 1:1, 4 kolom di mobile
- Terisi: `bg-green-100 border border-green-200`, teks `text-green-800`
- Kosong: `bg-red-100 border border-red-200`, teks `text-red-600`
- Habis kontrak: `bg-amber-light border border-amber-soft`, teks `text-amber-700`
- Tap → buka detail kamar

**List tagihan terbaru:**

```
Tagihan bulan ini        [Lihat semua →]

┌──────────────────────────────────┐
│ [BS] Budi Santoso    Rp 850rb    │
│      Kamar 2B        [Lunas ✓]   │
├──────────────────────────────────┤
│ [AN] Anisa Nur       Rp 750rb    │
│      Kamar 1C        [Belum ✕]   │
├──────────────────────────────────┤
│ [DW] Dwi Wahyu       Rp 900rb    │
│      Kamar 2A        [3 hari]    │
└──────────────────────────────────┘
```

---

### 3.4 Halaman Tagihan (`/dashboard/invoices`)

**Header (green-800):**

```
Tagihan · April 2026
Rp 9.250.000
[Semua (10)] [Lunas (7)] [Belum (3)]  ← pill filter
```

**Action bar (amber, sticky di bawah header):**

```
📤 Kirim reminder ke 3 penyewa
   Belum bayar · via WA & Email
```

**Filter chips (horizontal scroll):**

```
[Semua] [Lunas] [Belum bayar] [Hampir jatuh tempo]
```

**List tagihan:** sama dengan pattern di beranda tapi full list

**Tombol floating (mobile, fixed bottom):**

```
[ 📤 Kirim Reminder Sekarang ]  ← amber, full width, di atas bottom nav
```

---

### 3.5 Form Tambah Penyewa (`/dashboard/tenants/new`)

**Step indicator 3 langkah (sama style onboarding)**

**Step 1 — Data diri:**

```
Nama lengkap*    : [________________]
Nomor WhatsApp*  : [________________]
                   hint: Reminder tagihan dikirim ke sini
Email (opsional) : [________________]

Upload foto KTP (opsional):
┌─────────────────────────────┐
│  📎  Upload dari galeri HP  │
│      JPG, PNG · maks 5MB    │
└─────────────────────────────┘

[Lanjut →]
```

**Step 2 — Info sewa:**

```
Pilih kamar*:
┌────────────────────────────────┐
│ [1D] [2C]                      │  ← hanya kamar kosong
│  Kosong · Rp 850rb/bln         │
└────────────────────────────────┘

Harga sewa/bulan*: [Rp ________]
Tanggal mulai*   : [dd/mm/yyyy]
Lama kontrak*    : [12 bulan ▼]
Tanggal bayar    : [Tiap tgl 1 ▼]

                hint: Reminder otomatis H-7 & H-3

[← Kembali]  [Lanjut →]
```

**Step 3 — Konfirmasi:**

```
Pastikan data sudah benar

┌─────────────────────────────────┐
│ [RF]  Rizky Firmansyah          │  ← avatar inisial hijau
│       Kamar 1D · Lantai 1       │
├─────────────────────────────────┤
│ No. WA     │ 0857-1234-5678     │
│ Sewa/bln   │ Rp 850.000         │
│ Mulai      │ 1 Mei 2026         │
│ Kontrak    │ s/d 30 Apr 2027    │
│ Bayar tiap │ Tanggal 1          │
│ Reminder   │ ✓ Otomatis aktif   │
└─────────────────────────────────┘

ℹ️ Setelah disimpan:
   · Tagihan Mei 2026 otomatis dibuat
   · WA sambutan dikirim ke Rizky
   · Reminder bayar aktif mulai H-7

[← Periksa lagi]
[✓ Simpan & Kirim WA Sambutan]
```

---

### 3.6 Detail Penyewa (`/dashboard/tenants/[id]`)

**Header (green-800):**

```
← Kembali
Detail Penyewa
Kamar 2B
```

**Card penyewa:**

```
┌─────────────────────────────────┐
│ Background: green-50            │
│                                 │
│ [BS]  Budi Santoso              │  ← avatar 48x48
│       Kamar 2B · Lantai 2       │
│       [● Aktif]                 │  ← badge hijau
├─────────────────────────────────┤
│ No. HP     │ 0812-3456-7890 📞  │
│ Sewa/bln   │ Rp 850.000         │
│ Masuk      │ 1 Jan 2026         │
│ Kontrak    │ s/d 31 Des 2026    │
│ Sisa       │ 270 hari           │
└─────────────────────────────────┘
```

**Riwayat tagihan (list):**

```
Riwayat tagihan

[APR] April 2026
      Dibayar 28 Mar via GoPay   Rp 850rb [Lunas]

[MAR] Maret 2026
      Dibayar 1 Mar via QRIS     Rp 850rb [Lunas]
```

**Action bar (sticky bottom):**

```
[💬 Hubungi WA]  [📤 Kirim Tagihan]
```

---

### 3.7 Preview & Kirim Reminder WA (`/dashboard/invoices/remind`)

**Header (style WhatsApp — #075E54):**

```
← [AN] Anisa Nur          ···
        Kamar 1C · 0856-7890-1234
```

**Tampilan percakapan WA (bubble chat):**

```
─────── Hari ini ───────

┌────────────────────────────────┐  ← bubble masuk (putih)
│ 🏠 Tagihan Kos – April 2026   │
│                                │
│ Halo Kak Anisa 👋              │
│ Ini pengingat tagihan bulan ini│
│                                │
│ Rp 750.000                     │  ← font besar, green-800
│                                │
│ 📅 Jatuh tempo: 1 Mei 2026     │
│ 🏠 Kos Melati · Kamar 1C       │
│ ──────────────────────         │
│ 👆 Bayar Sekarang              │  ← green background
│ 09:41 ✓✓                       │
└────────────────────────────────┘
```

**Panel bawah (template & kirim):**

```
TEMPLATE PESAN
[H-7] [H-3] [H+1 terlambat] [Sambutan]

Kirim ke: 3 penyewa belum bayar  [Edit template ↗]

[ 📤 Kirim ke 3 Penyewa via WA ]  ← amber button
```

---

### 3.8 Laporan Keuangan (`/dashboard/reports`)

**Header (green-800):**

```
Laporan · April 2026
Rp 9.250.000
Pemasukan bulan ini · 10/12 kamar lunas
```

**Metric cards (2x2 grid):**

```
┌──────────┬──────────┐
│ 10       │ 2        │
│ Lunas    │ Belum    │
│ ↑2 blnllu│ Rp1,6jt  │
├──────────┼──────────┤
│ 92%      │ 2        │
│ Tingkat  │ Kamar    │
│ lunas    │ Kosong   │
└──────────┴──────────┘
```

**Bar chart 6 bulan:**

```
Pemasukan 6 bulan terakhir

     |                          ▐▐ ← green-800 (bulan ini)
     |              ▐▐ ▐▐ ▐▐ ▐▐
     | ▐▐ ▐▐ ▐▐ ▐▐
     |________________________
     Nov Des Jan Feb Mar Apr
```

- Implementasi: `recharts` BarChart atau bar CSS murni
- Batang bulan aktif: `green-800`
- Batang bulan lalu: `green-200`

**Rincian per lantai:**

```
Lantai 2   ████████████░  Rp 4,25jt
Lantai 1   █████████░░░░  Rp 3,15jt
Belum lunas ████░░░░░░░░  Rp 1,60jt
```

**Tombol export (3 kolom):**

```
[📄 PDF]  [📊 Excel]  [📤 Kirim WA]
```

---

### 3.9 Halaman Pembayaran untuk Penyewa (`/pay/[invoiceId]`)

> Halaman PUBLIK — dibuka dari link WA, tanpa perlu login

```
[Logo KostzyApp]

🏠 Kos Melati Indah

─────────────────────────────
TAGIHAN APRIL 2026

Budi Santoso
Kamar 2B

Rp 850.000
Jatuh tempo: 1 Mei 2026
─────────────────────────────

Pilih metode pembayaran:

○ QRIS (scan kamera)
○ GoPay
○ OVO
○ Transfer Bank (BCA / Mandiri)

[ Bayar Rp 850.000 ]  ← green-800, full width

Aman & terenkripsi 🔒
Powered by Midtrans
```

---

## 4. ATURAN MOBILE-FIRST WAJIB

### 4.1 Checklist responsif per halaman

Setiap halaman yang dibuat HARUS dicek:

- [ ] Tampil benar di 375px (iPhone SE)
- [ ] Tampil benar di 390px (iPhone 14)
- [ ] Tampil benar di 414px (Android umum)
- [ ] Tidak ada horizontal scroll
- [ ] Tombol minimal 44px tinggi (touch target)
- [ ] Font minimal 12px (tidak lebih kecil)
- [ ] Input tidak ter-zoom saat focus (font-size: 16px)
- [ ] Bottom nav tidak menutupi konten
- [ ] Modal/sheet muncul dari bawah di mobile

### 4.2 Pattern yang WAJIB dipakai

```tsx
// ✅ BENAR — mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

// ❌ SALAH — desktop first
<div className="grid grid-cols-3 max-md:grid-cols-1">
```

```tsx
// ✅ Padding responsif
<main className="px-4 md:px-8 lg:px-12 py-4 md:py-8">

// ✅ Typography responsif
<h1 className="text-2xl md:text-4xl lg:text-5xl font-black">

// ✅ Hide/show per breakpoint
<nav className="hidden md:flex">  {/* sidebar desktop */}
<nav className="flex md:hidden fixed bottom-0">  {/* bottom nav mobile */}
```

### 4.3 Bottom Sheet (mobile) vs Modal (desktop)

```tsx
// Gunakan pola ini untuk dialog/konfirmasi:
// Mobile: slide up dari bawah
// Desktop: centered modal

<div className={cn(
  "fixed z-50 bg-white",
  // Mobile: bottom sheet
  "bottom-0 left-0 right-0 rounded-t-3xl p-6",
  // Desktop: modal centered
  "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
  "md:w-[480px] md:rounded-2xl md:shadow-2xl"
)}>
```

### 4.4 Safe area untuk iPhone

```tsx
// Wrapper bottom nav — penting untuk iPhone dengan home bar
<nav className="
  fixed bottom-0 left-0 right-0
  pb-safe   {/* Tailwind safe area plugin */}
  bg-white border-t border-gray-200
">
```

Tambahkan ke `tailwind.config.ts`:

```ts
plugins: [require('tailwindcss-safe-area')],
```

---

## 5. ANIMASI & MICRO-INTERACTION

### 5.1 Loading states

```tsx
// Skeleton loader untuk list
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
  <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
</div>

// Spinner untuk aksi tombol
<button disabled className="...">
  <svg className="animate-spin h-4 w-4" .../>
  Mengirim...
</button>
```

### 5.2 Page transitions

```tsx
// Fade up untuk card list — gunakan animation-delay bertahap
<div className="animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
```

Tambahkan ke `tailwind.config.ts`:

```ts
animation: {
  'fade-up': 'fadeUp 0.4s ease forwards',
},
keyframes: {
  fadeUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
```

### 5.3 Tombol & tap feedback

```tsx
// Semua tombol wajib punya:
className = "... active:scale-[0.97] transition-transform duration-100";

// Checklist item tap feedback
className = "... active:bg-green-50 transition-colors";
```

---

## 6. STRUKTUR FILE

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── onboarding/page.tsx
├── dashboard/
│   ├── layout.tsx          ← shell dengan sidebar + bottom nav
│   ├── page.tsx            ← beranda
│   ├── rooms/
│   │   └── page.tsx
│   ├── tenants/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   └── remind/page.tsx
│   └── reports/
│       └── page.tsx
├── pay/
│   └── [invoiceId]/page.tsx
└── layout.tsx

components/
├── ui/                     ← shadcn components
├── layout/
│   ├── sidebar.tsx
│   ├── bottom-nav.tsx
│   └── top-bar.tsx
├── dashboard/
│   ├── room-grid.tsx
│   ├── invoice-list.tsx
│   ├── stat-cards.tsx
│   └── alert-card.tsx
├── forms/
│   ├── tenant-form.tsx
│   └── otp-input.tsx
└── shared/
    ├── avatar.tsx
    ├── badge.tsx
    └── loading-skeleton.tsx
```

---

## 7. PROMPT SPESIFIK PER HALAMAN

Copy-paste prompt ini langsung ke Claude Code:

### Login + OTP

```
Baca UI_SPEC.md Section 3.1.
Buat halaman /login dengan:
- Layout full screen background cream
- Form nomor HP → state kirim OTP → 6 input box OTP
- Countdown timer 30 detik
- Tombol sesuai design system
- Validasi: nomor HP harus 10-13 digit, dimulai 08
- Mobile-first, tidak ada horizontal scroll di 375px
```

### Dashboard Beranda

```
Baca UI_SPEC.md Section 3.3.
Buat halaman /dashboard dengan:
- Header green-800 dengan greeting + 3 stat
- Alert card amber jika ada tagihan belum bayar
- Room grid 4 kolom dengan warna status
- Invoice list 3 item terbaru
- Bottom nav mobile (4 item)
- Sidebar desktop (hidden di mobile)
- Semua data gunakan dummy realistis (nama Indonesia)
```

### Form Tambah Penyewa

```
Baca UI_SPEC.md Section 3.5.
Buat multi-step form /dashboard/tenants/new:
- Step indicator 3 langkah di atas
- Step 1: data diri dengan upload KTP
- Step 2: pemilihan kamar (tile visual), harga, tanggal
- Step 3: konfirmasi lengkap + info apa yang akan terjadi
- Validasi per step sebelum lanjut
- Animasi transisi antar step (slide)
- Mobile-first
```

### Laporan Keuangan

```
Baca UI_SPEC.md Section 3.8.
Buat halaman /dashboard/reports dengan:
- Header green-800 dengan total pemasukan
- 4 metric cards dalam 2x2 grid
- Bar chart 6 bulan pakai recharts (install jika belum ada)
- Progress bar rincian per lantai
- 3 tombol export: PDF, Excel, Kirim WA
- Data dummy 6 bulan realistis
- Mobile-first
```

---

## 8. CHECKLIST SEBELUM SUBMIT KE REVIEW

Setiap halaman sebelum dianggap selesai:

- [ ] Warna sesuai design system (tidak ada hardcoded hex selain yang di spec)
- [ ] Font: Fraunces untuk heading, Plus Jakarta Sans untuk body
- [ ] Semua teks Bahasa Indonesia
- [ ] Tidak ada placeholder "Lorem ipsum"
- [ ] Responsive di 375px tanpa horizontal scroll
- [ ] Tombol dan link navigasi berfungsi
- [ ] Loading state ada (skeleton atau spinner)
- [ ] Empty state ada (saat data kosong)
- [ ] Error state ada (validasi form)
- [ ] Mobile: bottom nav visible dan tidak menutupi konten
- [ ] Desktop: sidebar visible
- [ ] Animasi fade-up pada list items
- [ ] Touch target minimal 44px
