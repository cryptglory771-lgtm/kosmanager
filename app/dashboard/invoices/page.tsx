'use client'

import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Filter = 'all' | 'unpaid' | 'paid'
type Invoice = {
  id: string; amount: number; due_date: string; status: string
  tenants: { name: string; phone: string } | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sending, setSending] = useState<string | null>(null)
  const [preview, setPreview] = useState<Invoice | null>(null)

  useEffect(() => {
    supabase.from('invoices').select('id, amount, due_date, status, tenants(name, phone)')
      .order('due_date', { ascending: false })
      .then(({ data }) => setInvoices((data ?? []) as unknown as Invoice[]))
  }, [])

  const filtered = invoices.filter(inv => filter === 'all' ? true : inv.status === filter)

  async function sendReminder(inv: Invoice) {
    if (!inv.tenants) return
    setSending(inv.id)
    await fetch('/api/test-wa', { method: 'GET' }) // placeholder — nanti ganti ke endpoint kirim per-invoice
    await supabase.from('notifications').insert({ invoice_id: inv.id, channel: 'whatsapp', status: 'sent' })
    setSending(null)
    alert(`Reminder terkirim ke ${inv.tenants.name}`)
  }

  async function sendAll() {
    const unpaid = filtered.filter(inv => inv.status === 'unpaid')
    for (const inv of unpaid) await sendReminder(inv)
  }

  const waMessage = (inv: Invoice) =>
    `Halo ${inv.tenants?.name}, tagihan sewa sebesar Rp ${inv.amount.toLocaleString('id-ID')} jatuh tempo ${inv.due_date}. Segera lakukan pembayaran. Terima kasih!`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tagihan</h1>
        <Button onClick={sendAll} size="sm" variant="outline">
          <Send size={14} className="mr-1" /> Kirim Reminder Massal
        </Button>
      </div>

      <div className="flex gap-2">
        {(['all', 'unpaid', 'paid'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {f === 'all' ? 'Semua' : f === 'unpaid' ? 'Belum Lunas' : 'Lunas'}
          </button>
        ))}
      </div>

      {preview && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <p className="font-medium text-blue-800 mb-1">Preview pesan WA untuk {preview.tenants?.name}:</p>
          <p className="text-blue-700 italic">"{waMessage(preview)}"</p>
          <button onClick={() => setPreview(null)} className="text-xs text-blue-500 mt-2 hover:underline">Tutup preview</button>
        </div>
      )}

      <div className="bg-white rounded-xl border divide-y">
        {filtered.length === 0 && <p className="p-4 text-sm text-gray-400">Tidak ada tagihan.</p>}
        {filtered.map(inv => (
          <div key={inv.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{inv.tenants?.name ?? '—'}</p>
              <p className="text-xs text-gray-400">Jatuh tempo: {inv.due_date}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold">Rp {inv.amount.toLocaleString('id-ID')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {inv.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                </span>
              </div>
              {inv.status !== 'paid' && (
                <div className="flex gap-1">
                  <button onClick={() => setPreview(preview?.id === inv.id ? null : inv)}
                    className="text-xs text-blue-500 hover:underline">Preview WA</button>
                  <button onClick={() => sendReminder(inv)} disabled={sending === inv.id}
                    className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-0.5 ml-1">
                    {sending === inv.id ? '...' : 'Kirim'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
