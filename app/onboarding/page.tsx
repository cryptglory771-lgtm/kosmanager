'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', phone: '',
    room_count: '5', default_price: '',
    wa_notify: '',
  })

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function finish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data: property, error } = await supabase.from('properties').insert({
      owner_id: user?.id,
      name: form.name,
      address: form.address,
      phone: form.wa_notify,
    }).select().single()

    if (error) { alert('Gagal: ' + error.message); setLoading(false); return }

    const rooms = Array.from({ length: parseInt(form.room_count) }, (_, i) => ({
      property_id: property.id,
      room_number: String(i + 1).padStart(2, '0'),
      monthly_price: parseInt(form.default_price),
      status: 'empty',
    }))

    await supabase.from('rooms').insert(rooms)
    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Setup Kos Kamu 🏠</h1>
          <p className="text-sm text-gray-500 mt-1">Langkah {step} dari 3</p>
          <div className="flex gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Informasi Kos</h2>
            <Field label="Nama Kos *" value={form.name} onChange={v => set('name', v)} placeholder="Kos Pak Budi" />
            <Field label="Alamat *" value={form.address} onChange={v => set('address', v)} placeholder="Jl. Mawar No. 10, Jakarta" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Detail Kamar</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Kamar *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.room_count}
                onChange={e => set('room_count', e.target.value)}
              >
                {[3, 5, 8, 10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n} kamar</option>)}
              </select>
            </div>
            <Field label="Harga Default/Bulan (Rp) *" value={form.default_price} onChange={v => set('default_price', v)} placeholder="1500000" type="number" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Nomor WA Notifikasi</h2>
            <p className="text-sm text-gray-500">Nomor ini digunakan untuk menerima notifikasi dari sistem.</p>
            <Field label="Nomor WhatsApp *" value={form.wa_notify} onChange={v => set('wa_notify', v)} placeholder="08xxxxxxxxxx" type="tel" />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">Kembali</Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="flex-1"
              disabled={
                (step === 1 && (!form.name || !form.address)) ||
                (step === 2 && !form.default_price)
              }
            >
              Lanjut
            </Button>
          ) : (
            <Button onClick={finish} className="flex-1" disabled={loading || !form.wa_notify}>
              {loading ? 'Menyimpan...' : 'Mulai Pakai KosManager'}
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
