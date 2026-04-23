'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Upload, Bell, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/shared/avatar'
import { cn } from '@/lib/utils'
import { addMonths, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ── Types ──────────────────────────────────────────────────────────────────
type Room = { id: string; room_number: string; monthly_price: number }

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}
function formatRpFull(n: number) { return `Rp ${n.toLocaleString('id-ID')}` }
function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function formatDate(d: Date) {
  return format(d, 'd MMMM yyyy', { locale: localeId })
}

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ['Data Diri', 'Info Sewa', 'Konfirmasi']
  return (
    <div className="flex items-center px-4 md:px-8 pt-5 pb-4">
      {steps.map((label, i) => {
        const n       = i + 1
        const done    = n < current
        const active  = n === current
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all',
                done   ? 'bg-green-400 text-white'
                : active ? 'bg-green-800 text-white ring-4 ring-green-800/20'
                         : 'bg-gray-100 text-gray-400'
              )}>
                {done ? <Check size={14} strokeWidth={3} /> : n}
              </div>
              <span className={cn(
                'text-[10px] font-bold whitespace-nowrap',
                active ? 'text-green-800' : done ? 'text-green-600' : 'text-gray-400'
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-1.5 mb-4 rounded-full transition-colors',
                done ? 'bg-green-400' : 'bg-gray-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Field component ────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, type = 'text', hint,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-green-600 focus:outline-none bg-white transition-colors font-body"
        style={{ fontSize: '16px' }}
      />
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Select component ───────────────────────────────────────────────────────
function SelectField({
  label, value, onChange, children, hint,
}: {
  label: string; value: string; onChange: (v: string) => void
  children: React.ReactNode; hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-green-600 focus:outline-none bg-white transition-colors font-body appearance-none"
        style={{ fontSize: '16px' }}
      >
        {children}
      </select>
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Confirm Row ────────────────────────────────────────────────────────────
function ConfirmRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={cn('text-sm font-bold text-right', highlight ? 'text-green-700' : 'text-gray-800')}>
        {value}
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function NewTenantPage() {
  const router  = useRouter()
  const [step,  setStep]  = useState(1)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)
  const [ktpFile, setKtpFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:          '',
    phone:         '',
    email:         '',
    room_id:       '',
    monthly_price: '',
    start_date:    format(new Date(), 'yyyy-MM-dd'),
    duration:      '12',
    pay_day:       '1',
  })

  useEffect(() => {
    supabase
      .from('rooms')
      .select('id, room_number, monthly_price')
      .eq('status', 'empty')
      .order('room_number')
      .then(({ data }) => setRooms(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  function selectRoom(room: Room) {
    set('room_id', room.id)
    set('monthly_price', String(room.monthly_price))
  }

  function handleKtp(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setKtpFile(url)
  }

  async function submit() {
    setLoading(true)
    const endDate = format(
      addMonths(new Date(form.start_date), parseInt(form.duration)),
      'yyyy-MM-dd'
    )

    const { data: tenant, error } = await supabase.from('tenants').insert({
      name:       form.name,
      phone:      form.phone,
      email:      form.email || null,
      room_id:    form.room_id,
      start_date: form.start_date,
      end_date:   endDate,
    }).select().single()

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
      setLoading(false)
      return
    }

    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

    await supabase.from('invoices').insert({
      tenant_id: tenant.id,
      amount:    parseInt(form.monthly_price),
      due_date:  format(
        addMonths(new Date(form.start_date), 1),
        'yyyy-MM-dd'
      ),
      status: 'unpaid',
    })

    setLoading(false)
    router.push('/dashboard')
  }

  // Derived
  const selectedRoom = rooms.find(r => r.id === form.room_id)
  const startDt      = form.start_date ? new Date(form.start_date) : new Date()
  const endDt        = addMonths(startDt, parseInt(form.duration || '12'))
  const nextMonthDt  = addMonths(startDt, 1)

  const canNext: Record<number, boolean> = {
    1: !!(form.name && form.phone),
    2: !!(form.room_id && form.monthly_price && form.start_date),
  }

  return (
    <div className="min-h-screen bg-cream pb-8">

      {/* Mobile top bar */}
      <div className="flex md:hidden items-center gap-3 px-4 h-14 bg-white border-b border-gray-200 sticky top-0 z-30">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <h1 className="font-display font-bold text-base text-gray-900">Tambah Penyewa</h1>
      </div>

      <div className="max-w-lg mx-auto px-0 md:px-4 md:py-6">
        <StepIndicator current={step} />

        {/* ── Step 1: Data Diri ─────────────────────────────── */}
        {step === 1 && (
          <div className="px-4 md:px-0 space-y-4 animate-fade-up">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h2 className="font-display font-bold text-base text-gray-900 tracking-tight">Data Diri Penyewa</h2>

              <Field
                label="Nama Lengkap *"
                value={form.name}
                onChange={v => set('name', v)}
                placeholder="Budi Santoso"
              />
              <Field
                label="Nomor WhatsApp *"
                value={form.phone}
                onChange={v => set('phone', v)}
                placeholder="08xxxxxxxxxx"
                type="tel"
                hint="Reminder tagihan akan dikirim ke nomor ini"
              />
              <Field
                label="Email (Opsional)"
                value={form.email}
                onChange={v => set('email', v)}
                placeholder="budi@email.com"
                type="email"
              />

              {/* KTP Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Foto KTP (Opsional)
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    'w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2',
                    'transition-colors active:scale-[0.99]',
                    ktpFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  )}
                >
                  {ktpFile ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ktpFile} alt="KTP" className="h-20 rounded-lg object-cover" />
                      <span className="text-[11px] font-bold text-green-700">✓ Foto KTP terpilih</span>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload size={16} className="text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-600">Upload foto KTP</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG · maks 5MB</p>
                      </div>
                    </>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleKtp} />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canNext[1]}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl',
                'font-bold text-sm text-white transition-all active:scale-[0.98]',
                canNext[1] ? 'bg-green-800 hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              Lanjut <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* ── Step 2: Info Sewa ─────────────────────────────── */}
        {step === 2 && (
          <div className="px-4 md:px-0 space-y-4 animate-fade-up">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              <h2 className="font-display font-bold text-base text-gray-900 tracking-tight">Info Sewa</h2>

              {/* Room tiles */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Pilih Kamar *
                </label>
                {rooms.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-sm text-gray-400">Tidak ada kamar yang kosong.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rooms.map(room => {
                      const selected = form.room_id === room.id
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => selectRoom(room)}
                          className={cn(
                            'flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95',
                            selected
                              ? 'bg-green-800 border-green-800 text-white shadow-lg shadow-green-900/20'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                          )}
                        >
                          <span className="font-display font-black text-base leading-none">{room.room_number}</span>
                          <span className={cn('text-[10px] font-bold mt-1', selected ? 'text-green-200' : 'text-gray-400')}>
                            {formatRp(room.monthly_price)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <Field
                label="Harga Sewa / Bulan (Rp) *"
                value={form.monthly_price}
                onChange={v => set('monthly_price', v.replace(/\D/g, ''))}
                placeholder="1500000"
                type="text"
              />

              <Field
                label="Tanggal Mulai *"
                value={form.start_date}
                onChange={v => set('start_date', v)}
                type="date"
              />

              <SelectField
                label="Lama Kontrak *"
                value={form.duration}
                onChange={v => set('duration', v)}
              >
                {[1, 3, 6, 12, 24].map(m => (
                  <option key={m} value={m}>{m} bulan</option>
                ))}
              </SelectField>

              <SelectField
                label="Tanggal Bayar Tiap Bulan"
                value={form.pay_day}
                onChange={v => set('pay_day', v)}
                hint="Reminder otomatis dikirim H-7 & H-3 sebelum jatuh tempo"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Tiap tanggal {d}</option>
                ))}
              </SelectField>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-green-800 text-green-800 font-bold text-sm hover:bg-green-50 active:scale-[0.98] transition-all"
              >
                <ArrowLeft size={15} /> Kembali
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canNext[2]}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl',
                  'font-bold text-sm text-white transition-all active:scale-[0.98]',
                  canNext[2] ? 'bg-green-800 hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                Lanjut <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Konfirmasi ────────────────────────────── */}
        {step === 3 && (
          <div className="px-4 md:px-0 space-y-4 animate-fade-up">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1">
              Pastikan data sudah benar
            </p>

            {/* Tenant card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Avatar header */}
              <div className="bg-green-50 px-5 py-4 flex items-center gap-3 border-b border-gray-100">
                <Avatar initials={initials(form.name)} size="lg" />
                <div>
                  <p className="font-display font-bold text-base text-gray-900 tracking-tight">{form.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    Kamar {selectedRoom?.room_number ?? '—'}
                  </p>
                </div>
              </div>

              {/* Detail rows */}
              <div className="px-5 py-1">
                <ConfirmRow label="No. WA"     value={form.phone} />
                <ConfirmRow label="Sewa/Bulan" value={formatRpFull(parseInt(form.monthly_price || '0'))} highlight />
                <ConfirmRow label="Mulai"      value={formatDate(startDt)} />
                <ConfirmRow label="Kontrak"    value={`s/d ${formatDate(endDt)}`} />
                <ConfirmRow label="Bayar Tiap" value={`Tanggal ${form.pay_day}`} />
                <ConfirmRow
                  label="Reminder"
                  value={
                    <span className="flex items-center gap-1 text-green-700">
                      <Bell size={11} /> Otomatis aktif
                    </span>
                  }
                  highlight
                />
              </div>
            </div>

            {/* Info box */}
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3.5 space-y-2">
              <p className="text-[11px] font-bold text-green-800 uppercase tracking-wider">
                ℹ️ Setelah disimpan
              </p>
              {[
                `Tagihan ${format(nextMonthDt, 'MMMM yyyy', { locale: localeId })} otomatis dibuat`,
                `WA sambutan dikirim ke ${form.name.split(' ')[0]}`,
                'Reminder bayar aktif mulai H-7',
              ].map(item => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-green-400 font-black text-xs mt-0.5">·</span>
                  <p className="text-xs text-green-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={submit}
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-4 rounded-xl',
                  'font-bold text-sm text-white transition-all active:scale-[0.98]',
                  loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-800 hover:bg-green-700 shadow-lg shadow-green-900/20'
                )}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={3} />
                )}
                {loading ? 'Menyimpan...' : '✓ Simpan & Kirim WA Sambutan'}
              </button>

              <button
                onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                <ArrowLeft size={15} /> Periksa Lagi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
