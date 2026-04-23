import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { phone, otp } = await req.json()
  if (!phone || !otp) return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })

  const formatted = phone.startsWith('0') ? '+62' + phone.slice(1) : phone

  // Verifikasi OTP
  const { data, error } = await supabaseAdmin
    .from('otp_codes')
    .select()
    .eq('phone', formatted)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Kode OTP salah atau sudah expired' }, { status: 400 })

  // Hapus OTP setelah dipakai
  await supabaseAdmin.from('otp_codes').delete().eq('phone', formatted)

  // Email sintetis berdasarkan nomor HP
  const email = `${formatted.replace('+', '')}@kosmanager.app`

  // Buat user baru jika belum ada (abaikan error jika sudah ada)
  await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { phone: formatted } })

  // Generate magic link untuk login
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError) return NextResponse.json({ error: 'Gagal membuat sesi login' }, { status: 500 })

  return NextResponse.json({ token_hash: linkData.properties.hashed_token })
}
