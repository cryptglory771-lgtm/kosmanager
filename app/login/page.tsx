'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import { supabase } from '@/lib/supabase'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error) } else { setStep('otp') }
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    const { error: sessionError } = await supabase.auth.verifyOtp({ token_hash: data.token_hash, type: 'email' })
    if (sessionError) { setError(sessionError.message) } else { router.push('/onboarding') }
    setLoading(false)
  }

  return (
    <div className={`${fraunces.variable} ${plusJakarta.variable}`} style={{ fontFamily: 'var(--font-body, sans-serif)', minHeight: '100vh', display: 'flex' }}>

      {/* ── LEFT — Form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#FAFAF5', padding: '48px 32px', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Logo */}
          <Link href="/landing" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '48px' }}>
            <div style={{ width: '36px', height: '36px', background: '#0B4D35', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display, serif)', fontWeight: 900, fontSize: '18px', color: 'white' }}>K</div>
            <span style={{ fontFamily: 'var(--font-display, serif)', fontWeight: 700, fontSize: '20px', color: '#052E1A', letterSpacing: '-0.5px' }}>Kos<span style={{ color: '#138A5F' }}>Manager</span></span>
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '36px', fontWeight: 900, color: '#052E1A', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '8px' }}>
              {step === 'phone' ? 'Selamat datang\nkembali.' : 'Cek WhatsApp\nkamu.'}
            </h1>
            <p style={{ fontSize: '15px', color: '#78716C', lineHeight: 1.6, marginTop: '8px' }}>
              {step === 'phone'
                ? 'Masukkan nomor WhatsApp kamu untuk menerima kode OTP.'
                : <>Kode 6 digit dikirim ke <strong style={{ color: '#052E1A' }}>{phone}</strong></>}
            </p>
          </div>

          {/* Form */}
          {step === 'phone' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#44403C', marginBottom: '8px', letterSpacing: '0.01em' }}>
                  Nomor WhatsApp
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#78716C', fontWeight: 600, pointerEvents: 'none' }}>
                    +62
                  </div>
                  <input
                    type="tel"
                    placeholder="8xxxxxxxxxx"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !loading && phone && sendOtp()}
                    autoFocus
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '14px 14px 14px 52px',
                      fontSize: '15px', border: '1.5px solid #D6D3D1',
                      borderRadius: '12px', background: 'white',
                      color: '#1C1917', outline: 'none',
                      transition: 'border-color 0.2s',
                      fontFamily: 'var(--font-body, sans-serif)',
                    }}
                    onFocus={e => e.target.style.borderColor = '#0B4D35'}
                    onBlur={e => e.target.style.borderColor = '#D6D3D1'}
                  />
                </div>
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                onClick={sendOtp}
                disabled={loading || !phone}
                style={{
                  width: '100%', padding: '15px',
                  background: loading || !phone ? '#A7EDD0' : '#0B4D35',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700, cursor: loading || !phone ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body, sans-serif)',
                  transition: 'background 0.2s, transform 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? <><Spinner /> Mengirim...</> : <>Kirim Kode OTP <span style={{ fontSize: '18px' }}>→</span></>}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: '#78716C' }}>
                Belum punya akun?{' '}
                <Link href="/login" style={{ color: '#0B4D35', fontWeight: 600, textDecoration: 'none' }}>
                  Daftar gratis
                </Link>
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* OTP boxes */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#44403C', marginBottom: '8px' }}>
                  Kode OTP
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                  autoFocus
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '18px 14px',
                    fontSize: '28px', fontWeight: 800,
                    letterSpacing: '0.5em', textAlign: 'center',
                    border: '1.5px solid #D6D3D1', borderRadius: '12px',
                    background: 'white', color: '#052E1A', outline: 'none',
                    fontFamily: 'var(--font-display, serif)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#0B4D35'}
                  onBlur={e => e.target.style.borderColor = '#D6D3D1'}
                />
                <p style={{ fontSize: '12px', color: '#78716C', marginTop: '6px', textAlign: 'center' }}>
                  Berlaku 5 menit · Cek folder spam jika tidak muncul
                </p>
              </div>

              {error && <ErrorMsg>{error}</ErrorMsg>}

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                style={{
                  width: '100%', padding: '15px',
                  background: loading || otp.length < 6 ? '#A7EDD0' : '#0B4D35',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: 700, cursor: loading || otp.length < 6 ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body, sans-serif)',
                  transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                {loading ? <><Spinner /> Memverifikasi...</> : 'Masuk ke Dashboard'}
              </button>

              <button
                onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#78716C', fontFamily: 'var(--font-body, sans-serif)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
              >
                ← Ganti nomor HP
              </button>
            </div>
          )}

          {/* Footer */}
          <p style={{ marginTop: '48px', fontSize: '12px', color: '#A8A29E', textAlign: 'center', lineHeight: 1.6 }}>
            Dengan masuk, kamu menyetujui{' '}
            <a href="#" style={{ color: '#78716C', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Syarat & Ketentuan</a>
            {' '}dan{' '}
            <a href="#" style={{ color: '#78716C', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Kebijakan Privasi</a>
          </p>
        </div>
      </div>

      {/* ── RIGHT — Visual panel ── */}
      <div style={{
        flex: 1, background: '#0B4D35', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '64px', position: 'relative', overflow: 'hidden',
        minHeight: '100vh',
      }}
        className="login-panel"
      >
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,200,138,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Headline */}
          <div style={{ marginBottom: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#34C88A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Dipercaya 500+ pemilik kos
            </p>
            <h2 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '42px', fontWeight: 900, color: 'white', letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: '16px' }}>
              Tagihan otomatis,<br /><em style={{ color: '#34C88A', fontStyle: 'italic' }}>pendapatan aman.</em>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '380px' }}>
              Ribuan pemilik kos di Indonesia sudah menghemat puluhan jam setiap bulan dengan KosManager.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginBottom: '48px', paddingBottom: '48px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {[['7.000+', 'Kamar dikelola'], ['98%', 'Tagihan terbayar'], ['< 3 mnt', 'Setup pertama']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-display, serif)', fontSize: '28px', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>{val}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: '24px' }}>
            <div style={{ fontSize: '20px', marginBottom: '12px' }}>★★★★★</div>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '20px' }}>
              "Dulu tiap tanggal 1 saya harus WA satu-satu ke 18 penyewa. Sekarang sistem yang kirimin, saya tinggal tunggu notifikasi uang masuk."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0F6E4C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'white', flexShrink: 0 }}>SR</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>Bu Sri Rahayu</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>Pemilik Kos · Yogyakarta · 18 kamar</div>
              </div>
            </div>
          </div>

          {/* WA notification mockup */}
          <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>Contoh Notifikasi WA Otomatis ✓</div>
            <div style={{ background: '#DCF8C6', borderRadius: '10px 2px 10px 10px', padding: '10px 12px', fontSize: '12px', color: '#1F2937', lineHeight: 1.6, maxWidth: '80%', marginLeft: 'auto' }}>
              Halo <strong>Bu Sari</strong>! 👋<br />
              Tagihan kamar <strong>2B</strong> sebesar <strong>Rp 1.500.000</strong> jatuh tempo dalam <strong>3 hari</strong> lagi. Segera lakukan pembayaran. 🙏
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: '6px' }}>09:41 ✓✓ Terkirim otomatis</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: 'white', borderRadius: '50%',
      display: 'inline-block', animation: 'spin 0.7s linear infinite',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>⚠️</span> {children}
    </div>
  )
}
