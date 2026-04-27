'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ArrowLeft, ArrowRight, Building2, BedDouble, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

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

const EMOJI_FASILITAS_PROPERTI: Record<keyof FasilitasProperti, string> = {
  wifi: '📶', parkir_motor: '🏍️', parkir_mobil: '🚗',
  dapur_bersama: '🍳', laundry: '👕', security_24jam: '💂',
  cctv: '📹', musholla: '🕌', kolam_renang: '🏊',
}

const LABEL_FASILITAS_PROPERTI: Record<keyof FasilitasProperti, string> = {
  wifi: 'WiFi', parkir_motor: 'Parkir Motor', parkir_mobil: 'Parkir Mobil',
  dapur_bersama: 'Dapur Bersama', laundry: 'Laundry', security_24jam: 'Security 24j',
  cctv: 'CCTV', musholla: 'Musholla', kolam_renang: 'Kolam Renang',
}

const EMOJI_FASILITAS_KAMAR: Record<keyof FasilitasKamar, string> = {
  ac: '❄️', kamar_mandi_dalam: '🚿', kulkas: '🧊',
  tv: '📺', meja_belajar: '📚', lemari: '🪞',
  kasur: '🛏️', jendela: '🪟', balkon: '🌿',
}

const LABEL_FASILITAS_KAMAR: Record<keyof FasilitasKamar, string> = {
  ac: 'AC', kamar_mandi_dalam: 'KM Dalam', kulkas: 'Kulkas',
  tv: 'TV', meja_belajar: 'Meja Belajar', lemari: 'Lemari',
  kasur: 'Kasur', jendela: 'Jendela', balkon: 'Balkon',
}

const TIPE_KAMAR_OPTIONS = ['Standar', 'Premier', 'Deluxe', 'Suite', 'VIP']

const STEPS: { step: Step; label: string; icon: React.ElementType }[] = [
  { step: 1, label: 'Pemilik',  icon: User },
  { step: 2, label: 'Properti', icon: Building2 },
  { step: 3, label: 'Kamar',   icon: BedDouble },
]

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center px-6 pt-6 pb-2">
      {STEPS.map(({ step, label, icon: Icon }, i) => {
        const done   = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                done   ? 'bg-green-500 text-white'
                : active ? 'bg-green-800 text-white shadow-lg shadow-green-800/30'
                         : 'bg-gray-100 text-gray-400'
              )}>
                {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
              </div>
              <span className={cn(
                'text-[10px] font-black uppercase tracking-wide',
                active ? 'text-green-800' : done ? 'text-green-600' : 'text-gray-400'
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300',
                done ? 'bg-green-400' : 'bg-gray-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontSize: '16px' }}
        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-600 transition-colors"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Toggle Chip ────────────────────────────────────────────────────────────
function Chip({
  emoji, label, active, onClick,
}: {
  emoji: string; label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-center transition-all active:scale-95',
        active
          ? 'bg-green-800 border-green-800 text-white'
          : 'bg-white border-gray-200 text-gray-500'
      )}
    >
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-[9px] font-bold leading-tight">{label}</span>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router   = useRouter()
  const [step,     setStep]     = useState<Step>(1)
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)

  const [owner, setOwner] = useState({ name: '', phone: '' })
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
      // Use limit(1) — .single() fails when user has multiple properties
      const { data: props } = await supabase
        .from('properties').select('id').eq('owner_id', user.id).limit(1)
      if (props && props.length > 0) { router.push('/dashboard'); return }
      setChecking(false)
    }
    check()
  }, [router])

  function setO(f: string, v: string) { setOwner(p => ({ ...p, [f]: v })) }
  function setP(f: string, v: string) { setProperty(p => ({ ...p, [f]: v })) }
  function setR(f: string, v: string) { setRooms(p => ({ ...p, [f]: v })) }

  function togglePropFas(key: keyof FasilitasProperti) {
    setProperty(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }
  function toggleRoomFas(key: keyof FasilitasKamar) {
    setRooms(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id:    user.id,
      name:  owner.name,
      phone: owner.phone,
    })

    const { data: prop, error: propError } = await supabase.from('properties').insert({
      owner_id:  user.id,
      name:      property.name,
      address:   property.address,
      phone:     property.phone,
      jenis_kos: property.jenis_kos,
      fasilitas: property.fasilitas,
    }).select().single()

    if (propError || !prop) {
      alert('Gagal menyimpan properti: ' + propError?.message)
      setLoading(false)
      return
    }

    const count    = parseInt(rooms.count)
    const price    = parseInt(rooms.default_price)
    const roomList = Array.from({ length: count }, (_, i) => ({
      property_id:    prop.id,
      room_number:    String(i + 1).padStart(2, '0'),
      monthly_price:  price,
      status:         'empty',
      tipe_kamar:     rooms.tipe_kamar,
      fasilitas:      rooms.fasilitas,
    }))
    await supabase.from('rooms').insert(roomList)

    setLoading(false)
    router.push('/dashboard')
  }

  const canNext: Record<Step, boolean> = {
    1: !!(owner.name),
    2: !!(property.name && property.address),
    3: !!(rooms.count && rooms.default_price),
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Green top bar ─────────────────────────────────── */}
      <div className="bg-green-800 px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
            <span className="font-display font-black text-green-800 text-sm">K</span>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            Kos<span className="text-green-400">Manager</span>
          </span>
        </div>
        <p className="text-green-300 text-xs font-bold uppercase tracking-widest mt-4 mb-0.5">
          Setup Akun
        </p>
        <h1 className="font-display font-black text-white text-2xl tracking-tight leading-tight">
          {step === 1 ? 'Halo, siapa kamu? 👋'
           : step === 2 ? 'Cerita tentang kos-mu 🏠'
           : 'Berapa kamar yang ada? 🛏️'}
        </h1>
        <p className="text-green-300/80 text-sm mt-1">
          {step === 1 ? 'Isi data dirimu sebagai pemilik kos.'
           : step === 2 ? 'Kami butuh info dasar properti kos-mu.'
           : 'Setup kamar awal, bisa diubah kapan saja.'}
        </p>
      </div>

      {/* ── Card ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white mx-4 -mt-3 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">

          <StepIndicator current={step} />

          <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">

            {/* ── Step 1: Pemilik ─────────────────────────── */}
            {step === 1 && (
              <>
                <Field label="Nama Lengkap *" value={owner.name} onChange={v => setO('name', v)} placeholder="Budi Santoso" />
                <Field label="Nomor WhatsApp" value={owner.phone} onChange={v => setO('phone', v)} placeholder="08xxxxxxxxxx" type="tel"
                  hint="Digunakan untuk notifikasi penting." />
              </>
            )}

            {/* ── Step 2: Properti ─────────────────────────── */}
            {step === 2 && (
              <>
                <Field label="Nama Kos *" value={property.name} onChange={v => setP('name', v)} placeholder="Kos Bu Dewi" />
                <Field label="Alamat Kos *" value={property.address} onChange={v => setP('address', v)} placeholder="Jl. Melati No. 5, Bandung" />
                <Field label="WhatsApp Kos" value={property.phone} onChange={v => setP('phone', v)} placeholder="08xxxxxxxxxx" type="tel" />

                {/* Jenis Kos */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Jenis Kos *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'putra',  label: 'Putra',  emoji: '👨' },
                      { key: 'putri',  label: 'Putri',  emoji: '👩' },
                      { key: 'campur', label: 'Campur', emoji: '👥' },
                    ] as const).map(({ key, label, emoji }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setProperty(p => ({ ...p, jenis_kos: key }))}
                        className={cn(
                          'py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95',
                          property.jenis_kos === key
                            ? 'bg-green-800 border-green-800 text-white'
                            : 'border-gray-200 text-gray-600'
                        )}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fasilitas Properti */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Fasilitas Properti <span className="normal-case font-medium text-gray-300">(opsional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DEFAULT_FASILITAS_PROPERTI) as (keyof FasilitasProperti)[]).map(key => (
                      <Chip
                        key={key}
                        emoji={EMOJI_FASILITAS_PROPERTI[key]}
                        label={LABEL_FASILITAS_PROPERTI[key]}
                        active={property.fasilitas[key]}
                        onClick={() => togglePropFas(key)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3: Kamar ──────────────────────────── */}
            {step === 3 && (
              <>
                {/* Jumlah Kamar */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Jumlah Kamar *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20, 25, 30, 40, 50].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setR('count', String(n))}
                        className={cn(
                          'py-2.5 rounded-xl border-2 text-sm font-bold transition-all active:scale-95',
                          rooms.count === String(n)
                            ? 'bg-green-800 border-green-800 text-white'
                            : 'border-gray-200 text-gray-600'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      value={rooms.count}
                      onChange={e => setR('count', e.target.value)}
                      placeholder="Atau ketik jumlah lain..."
                      style={{ fontSize: '16px' }}
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-600 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Kamar diberi nomor otomatis (01, 02...). Bisa diubah nanti.</p>
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                    Harga Sewa / Bulan *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                    <input
                      type="number"
                      value={rooms.default_price}
                      onChange={e => setR('default_price', e.target.value)}
                      placeholder="1500000"
                      style={{ fontSize: '16px' }}
                      className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-green-600 transition-colors"
                    />
                  </div>
                  {rooms.default_price && (
                    <p className="text-[11px] text-green-700 font-bold mt-1">
                      = Rp {parseInt(rooms.default_price).toLocaleString('id-ID')} / bulan
                    </p>
                  )}
                </div>

                {/* Tipe Kamar */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Tipe Kamar Default
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {TIPE_KAMAR_OPTIONS.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setR('tipe_kamar', t)}
                        className={cn(
                          'px-3.5 py-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95',
                          rooms.tipe_kamar === t
                            ? 'bg-green-800 border-green-800 text-white'
                            : 'border-gray-200 text-gray-600'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fasilitas Kamar */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Fasilitas Kamar Default <span className="normal-case font-medium text-gray-300">(opsional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DEFAULT_FASILITAS_KAMAR) as (keyof FasilitasKamar)[]).map(key => (
                      <Chip
                        key={key}
                        emoji={EMOJI_FASILITAS_KAMAR[key]}
                        label={LABEL_FASILITAS_KAMAR[key]}
                        active={rooms.fasilitas[key]}
                        onClick={() => toggleRoomFas(key)}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Navigation ─────────────────────────────────── */}
          <div className="px-6 pt-3 pb-safe md:pb-6 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(s => (s - 1) as Step)}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-gray-200 text-sm font-bold text-gray-600 active:scale-[0.98] transition-all"
                >
                  <ArrowLeft size={15} /> Kembali
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep(s => (s + 1) as Step)}
                  disabled={!canNext[step]}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all',
                    canNext[step]
                      ? 'bg-green-800 text-white active:scale-[0.98] shadow-lg shadow-green-800/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Lanjut <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={loading || !canNext[3]}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all',
                    !loading && canNext[3]
                      ? 'bg-green-800 text-white active:scale-[0.98] shadow-lg shadow-green-800/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  {loading ? 'Menyimpan...' : 'Selesai & Mulai Pakai'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
