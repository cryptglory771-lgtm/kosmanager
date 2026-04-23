import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Nomor HP wajib diisi' }, { status: 400 })

  const formatted = phone.startsWith('0') ? '+62' + phone.slice(1) : phone
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error } = await supabaseAdmin.from('otp_codes').upsert({ phone: formatted, otp, expires_at })
  if (error) return NextResponse.json({ error: 'Gagal menyimpan OTP' }, { status: 500 })

  const message = `Kode OTP KosManager kamu: *${otp}*\n\nBerlaku 5 menit. Jangan bagikan ke siapapun.`
  await sendWhatsApp(formatted, message)

  return NextResponse.json({ ok: true })
}
