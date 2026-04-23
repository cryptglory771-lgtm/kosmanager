'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const [owner, setOwner] = useState({ name: '', email: '', address: '' })
  const [property, setProperty] = useState({ name: '', address: '', phone: '' })
  const [rooms, setRooms] = useState({ count: '5', default_price: '' })

  // Jika user sudah punya property, langsung ke dashboard
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prop } = await supabase.from('properties').select('id').eq('owner_id', user.id).single()
      if (prop) { router.push('/dashboard'); return }
      setChecking(false)
    }
    check()
  }, [router])

  function setO(f: string, v: string) { setOwner(p => ({ ...p, [f]: v })) }
  function setP(f: string, v: string) { setProperty(p => ({ ...p, [f]: v })) }
  function setR(f: string, v: string) { setRooms(p => ({ ...p, [f]: v })) }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Simpan profil owner
    await supabase.from('profiles').upsert({
      id: user.id,
      name: owner.name,
      email: owner.email,
      address: owner.address,
    })

    // Buat property
    const { data: prop, error: propError } = await supabase.from('properties').insert({
      owner_id: user.id,
      name: property.name,
      address: property.address,
      phone: property.phone,
    }).select().single()

    if (propError || !prop) {
      alert('Gagal menyimpan properti: ' + propError?.message)
      setLoading(false)
      return
    }

    // Buat kamar
    const count = parseInt(rooms.count)
    const price = parseInt(rooms.default_price)
    const roomList = Array.from({ length: count }, (_, i) => ({
      property_id: prop.id,
      room_number: String(i + 1).padStart(2, '0'),
      monthly_price: price,
      status: 'empty',
    }))
    await supabase.from('rooms').insert(roomList)

    setLoading(false)
    router.push('/dashboard')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Memuat...</p>
      </div>
    )
  }

  const stepTitles: Record<Step, string> = {
    1: 'Data Pemilik',
    2: 'Informasi Properti',
    3: 'Setup Kamar',
  }

  const canNext: Record<Step, boolean> = {
    1: !!(owner.name && owner.email),
    2: !!(property.name && property.address && property.phone),
    3: !!(rooms.count && rooms.default_price),
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Setup Akun</p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{stepTitles[step]}</h1>
          <p className="text-xs text-gray-400 mt-0.5">Langkah {step} dari 3</p>
          <div className="flex gap-1 mt-3">
            {([1, 2, 3] as Step[]).map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Data Pemilik */}
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Nama Lengkap *" value={owner.name} onChange={v => setO('name', v)} placeholder="Budi Santoso" />
            <Field label="Email *" value={owner.email} onChange={v => setO('email', v)} placeholder="budi@email.com" type="email" />
            <Field label="Alamat Pemilik" value={owner.address} onChange={v => setO('address', v)} placeholder="Jl. Mawar No. 10, Jakarta" />
          </div>
        )}

        {/* Step 2: Informasi Properti */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label="Nama Kos *" value={property.name} onChange={v => setP('name', v)} placeholder="Kos Pak Budi" />
            <Field label="Alamat Kos *" value={property.address} onChange={v => setP('address', v)} placeholder="Jl. Melati No. 5, Bandung" />
            <Field label="Nomor WhatsApp Kos *" value={property.phone} onChange={v => setP('phone', v)} placeholder="08xxxxxxxxxx" type="tel" />
          </div>
        )}

        {/* Step 3: Setup Kamar */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kamar *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rooms.count}
                onChange={e => setR('count', e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50].map(n => (
                  <option key={n} value={n}>{n} kamar</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Kamar diberi nomor otomatis (01, 02, 03, ...). Bisa diubah nanti.</p>
            </div>
            <Field
              label="Harga Sewa Default/Bulan (Rp) *"
              value={rooms.default_price}
              onChange={v => setR('default_price', v.replace(/\D/g, ''))}
              placeholder="1500000"
              type="number"
            />
            {rooms.default_price && (
              <p className="text-xs text-blue-600">
                = Rp {parseInt(rooms.default_price).toLocaleString('id-ID')}/bulan
              </p>
            )}
          </div>
        )}

        {/* Navigasi */}
        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => (s - 1) as Step)} className="flex-1">
              Kembali
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(s => (s + 1) as Step)} disabled={!canNext[step]} className="flex-1">
              Lanjut
            </Button>
          ) : (
            <Button onClick={finish} disabled={loading || !canNext[3]} className="flex-1">
              {loading ? 'Menyimpan...' : 'Selesai & Mulai Pakai'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
