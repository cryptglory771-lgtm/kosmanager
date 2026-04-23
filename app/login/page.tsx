'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

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

    // Gunakan token dari server untuk establish session di browser
    const { error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: data.token_hash,
      type: 'email',
    })
    if (sessionError) { setError(sessionError.message) } else { router.push('/dashboard') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">🏠 KosManager</h1>
          <p className="text-gray-500 text-sm mt-1">Masuk ke akun kamu</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && phone && sendOtp()}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={sendOtp} disabled={loading || !phone} className="w-full">
              {loading ? 'Mengirim...' : 'Kirim Kode OTP via WhatsApp'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Kode OTP dikirim ke WhatsApp <strong>{phone}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode OTP</label>
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && otp.length === 6 && verifyOtp()}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest text-center text-lg"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full">
              {loading ? 'Memverifikasi...' : 'Masuk'}
            </Button>
            <button onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="w-full text-sm text-gray-500 hover:text-gray-700">
              Ganti nomor
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
