import { NextResponse } from 'next/server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  const result = await sendWhatsApp(
    '6281328154964', // ganti dengan nomor HP kamu (format internasional)
    'Halo! Ini test pesan dari KosManager 🏠'
  )
  return NextResponse.json(result)
}
