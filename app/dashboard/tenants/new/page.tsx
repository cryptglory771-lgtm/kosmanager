'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { addMonths, format } from 'date-fns'

type Room = { id: string; room_number: string; monthly_price: number }

export default function NewTenantPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    room_id: '', monthly_price: '', start_date: format(new Date(), 'yyyy-MM-dd'), duration: '12',
  })

  useEffect(() => {
    supabase.from('rooms').select('id, room_number, monthly_price').eq('status', 'empty').order('room_number').then(({ data }) => setRooms(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function submit() {
    setLoading(true)
    const endDate = format(addMonths(new Date(form.start_date), parseInt(form.duration)), 'yyyy-MM-dd')

    const { data: tenant, error } = await supabase.from('tenants').insert({
      name: form.name, phone: form.phone, email: form.email || null,
      room_id: form.room_id, start_date: form.start_date, end_date: endDate,
    }).select().single()

    if (error) { alert('Gagal menyimpan: ' + error.message); setLoading(false); return }

    await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

    // Buat tagihan bulan pertama
    await supabase.from('invoices').insert({
      tenant_id: tenant.id,
      amount: parseInt(form.monthly_price),
      due_date: format(addMonths(new Date(form.start_date), 1), 'yyyy-MM-dd'),
      status: 'unpaid',
    })

    setLoading(false)
    router.push('/dashboard')
  }

  const selectedRoom = rooms.find(r => r.id === form.room_id)
  const endDate = form.start_date && form.duration
    ? format(addMonths(new Date(form.start_date), parseInt(form.duration)), 'dd MMM yyyy')
    : '—'

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-gray-900">Tambah Penyewa</h1>
        <span className="text-sm text-gray-400 ml-auto">Langkah {step} dari 3</span>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-800">Data Diri Penyewa</h2>
            <Field label="Nama Lengkap *" value={form.name} onChange={v => set('name', v)} placeholder="Budi Santoso" />
            <Field label="Nomor WhatsApp *" value={form.phone} onChange={v => set('phone', v)} placeholder="08xxxxxxxxxx" type="tel" />
            <Field label="Email (opsional)" value={form.email} onChange={v => set('email', v)} placeholder="budi@email.com" type="email" />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-800">Info Sewa</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kamar *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.room_id}
                onChange={e => {
                  const room = rooms.find(r => r.id === e.target.value)
                  set('room_id', e.target.value)
                  if (room) set('monthly_price', String(room.monthly_price))
                }}
              >
                <option value="">-- Pilih kamar kosong --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>Kamar {r.room_number} — Rp {r.monthly_price.toLocaleString('id-ID')}</option>)}
              </select>
            </div>
            <Field label="Harga Sewa/Bulan (Rp) *" value={form.monthly_price} onChange={v => set('monthly_price', v)} placeholder="1500000" type="number" />
            <Field label="Tanggal Mulai *" value={form.start_date} onChange={v => set('start_date', v)} type="date" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lama Kontrak</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
              >
                {[1, 3, 6, 12, 24].map(m => <option key={m} value={m}>{m} bulan</option>)}
              </select>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-semibold text-gray-800">Konfirmasi</h2>
            <div className="space-y-2 text-sm">
              <Row label="Nama" value={form.name} />
              <Row label="WhatsApp" value={form.phone} />
              {form.email && <Row label="Email" value={form.email} />}
              <Row label="Kamar" value={selectedRoom ? `Kamar ${selectedRoom.room_number}` : '—'} />
              <Row label="Harga Sewa" value={`Rp ${parseInt(form.monthly_price || '0').toLocaleString('id-ID')}/bln`} />
              <Row label="Mulai" value={form.start_date} />
              <Row label="Kontrak selesai" value={endDate} />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Kembali</Button>
        )}
        {step < 3 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            className="flex-1"
            disabled={
              (step === 1 && (!form.name || !form.phone)) ||
              (step === 2 && (!form.room_id || !form.monthly_price || !form.start_date))
            }
          >
            Lanjut
          </Button>
        ) : (
          <Button onClick={submit} className="flex-1" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Penyewa'}
          </Button>
        )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
