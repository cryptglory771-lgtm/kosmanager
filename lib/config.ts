export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'KosManager',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? 'Kelola kos lebih cerdas & otomatis',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kosmanager-two.vercel.app',
  supportWa: process.env.NEXT_PUBLIC_SUPPORT_WA ?? '',
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@kosmanager.app',
  description:
    'KosManager membantu pemilik kos kirim tagihan, reminder WhatsApp otomatis, dan terima pembayaran digital — tanpa ribet.',
  keywords: [
    'aplikasi kos', 'manajemen kos', 'tagihan kos otomatis',
    'reminder WhatsApp kos', 'software kos Indonesia',
    'kelola kos online', 'KosManager',
  ],
}
