'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Step = 1 | 2 | 3

type FasilitasProperti = {
  wifi: boolean; parkir_motor: boolean; parkir_mobil: boolean
  dapur_bersama: boolean; laundry: boolean; security_24jam: boolean
  cctv: boolean; musholla: boolean; kolam_renang: boolean
}

type FasilitasKamar = {
  ac: boolean; kamar_mandi_dalam: boolean; kulkas: boolean
  tv: boolean; meja_belajar: boolean; lemari: boolean
  kasur: boolean; jendela: boolean; balkon: boolean
}

const DEFAULT_FASILITAS_PROPERTI: FasilitasProperti = {
  wifi: false, parkir_motor: false, parkir_mobil: false,
  dapur_bersama: false, laundry: false, security_24jam: false,
  cctv: false, musholla: false, kolam_renang: false,
}

const DEFAULT_FASILITAS_KAMAR: FasilitasKamar = {
  ac: false, kamar_mandi_dalam: false, kulkas: false,
  tv: false, meja_belajar: false, lemari: false,
  kasur: false, jendela: false, balkon: false,
}

const LABEL_FASILITAS_PROPERTI: Record<keyof FasilitasProperti, string> = {
  wifi: 'WiFi', parkir_motor: 'Parkir Motor', parkir_mobil: 'Parkir Mobil',
  dapur_bersama: 'Dapur Bersama', laundry: 'Laundry', security_24jam: 'Security 24 Jam',
  cctv: 'CCTV', musholla: 'Musholla', kolam_renang: 'Kolam Renang',
}

const LABEL_FASILITAS_KAMAR: Record<keyof FasilitasKamar, string> = {
  ac: 'AC', kamar_mandi_dalam: 'Kamar Mandi Dalam', kulkas: 'Kulkas',
  tv: 'TV', meja_belajar: 'Meja Belajar', lemari: 'Lemari',
  kasur: 'Kasur', jendela: 'Jendela', balkon: 'Balkon',
}

const TIPE_KAMAR_OPTIONS = ['Standar', 'Premier', 'Deluxe', 'Suite', 'VIP']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const [owner, setOwner] = useState({ name: '', email: '', address: '' })
  const [property, setProperty] = useState({
    name: '', address: '', phone: '',
    jenis_kos: 'campur' as 'putra' | 'putri' | 'campur',
    fasilitas: { ...DEFAULT_FASILITAS_PROPERTI },
  })
  const [rooms, setRooms] = useState({
    count: '5',
    default_price: '',
    tipe_kamar: 'Standar',
    fasilitas: { ...DEFAULT_FASILITAS_KAMAR },
  })

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

  function togglePropFasilitas(key: keyof FasilitasProperti) {
    setProperty(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  function toggleRoomFasilitas(key: keyof FasilitasKamar) {
    setRooms(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      name: owner.name,
      email: owner.email,
      address: owner.address,
    })

    const { data: prop, error: propError } = await supabase.from('properties').insert({
      owner_id: user.id,
      name: property.name,
      address: property.address,
      phone: property.phone,
      jenis_kos: property.jenis_kos,
      fasilitas: property.fasilitas,
    }).select().single()

    if (propError || !prop) {
      alert('Gagal menyimpan properti: ' + propError?.message)
      setLoading(false)
      return
    }

    const count = parseInt(rooms.count)
    const price = parseInt(rooms.default_price)
    const roomList = Array.from({ length: count }, (_, i) => ({
      property_id: prop.id,
      room_number: String(i + 1).padStart(2, '0'),
      monthly_price: price,
      status: 'empty',
      tipe_kamar: rooms.tipe_kamar,
      fasilitas: rooms.fasilitas,
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border p-8 space-y-6">

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

            {/* Jenis Kos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kos *</label>
              <div className="flex gap-2">
                {(['putra', 'putri', 'campur'] as const).map(jenis => (
                  <button
                    key={jenis}
                    type="button"
                    onClick={() => setProperty(p => ({ ...p, jenis_kos: jenis }))}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors capitalize ${
                      property.jenis_kos === jenis
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}
                  >
                    {jenis === 'putra' ? '👨 Putra' : jenis === 'putri' ? '👩 Putri' : '👥 Campur'}
                  </button>
                ))}
              </div>
            </div>

            {/* Fasilitas Properti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fasilitas Properti</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DEFAULT_FASILITAS_PROPERTI) as (keyof FasilitasProperti)[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePropFasilitas(key)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                      property.fasilitas[key]
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {property.fasilitas[key] ? '✓ ' : ''}{LABEL_FASILITAS_PROPERTI[key]}
                  </button>
                ))}
              </div>
            </div>
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

            {/* Tipe Kamar Default */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kamar Default</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={rooms.tipe_kamar}
                onChange={e => setR('tipe_kamar', e.target.value)}
              >
                {TIPE_KAMAR_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Bisa diubah per kamar setelah setup selesai.</p>
            </div>

            {/* Fasilitas Kamar Default */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fasilitas Kamar Default</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DEFAULT_FASILITAS_KAMAR) as (keyof FasilitasKamar)[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleRoomFasilitas(key)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                      rooms.fasilitas[key]
                        ? 'bg-green-50 border-green-400 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {rooms.fasilitas[key] ? '✓ ' : ''}{LABEL_FASILITAS_KAMAR[key]}
                  </button>
                ))}
              </div>
            </div>
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
