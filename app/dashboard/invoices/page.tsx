'use client'

import { useEffect, useState } from 'react'
import { Send, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Filter = 'all' | 'unpaid' | 'paid'
type Invoice = {
  id: string
  amount: number
  due_date: string
  status: string
  tenants: { name: string; phone: string; rooms: { room_number: string; properties: { name: string } } } | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sending, setSending] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase
      .from('invoices')
      .select('id, amount, due_date, status, tenants(name, phone, rooms(room_number, properties(name)))')
      .order('due_date', { ascending: false })
      .then(({ data }) => setInvoices((data ?? []) as unknown as Invoice[]))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function previewMessage(inv: Invoice) {
    const name = inv.tenants?.name ?? ''
    const property = inv.tenants?.rooms?.properties?.name ?? 'Kos'
    const room = inv.tenants?.rooms?.room_number ?? '-'
    const rupiah = `Rp ${inv.amount.toLocaleString('id-ID')}`
    return (
      `Halo *${name}*! 👋\n\n` +
      `Ini pengingat tagihan sewa dari *${property}*:\n\n` +
      `📋 *Detail Tagihan*\n` +
      `• Kamar: ${room}\n` +
      `• Jumlah: ${rupiah}\n` +
      `• Jatuh tempo: ${inv.due_date}\n\n` +
      `Mohon segera lakukan pembayaran. Terima kasih! 🙏`
    )
  }

  async function sendReminder(inv: Invoice) {
    if (!inv.tenants) return
    setSending(inv.id)
    const res = await fetch('/api/invoices/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: inv.id }),
    })
    const data = await res.json()
    setSending(null)
    if (data.ok) {
      showToast(`✓ Reminder terkirim ke ${inv.tenants.name}`)
    } else {
      showToast(`✗ Gagal kirim ke ${inv.tenants.name}`)
    }
  }

  async function sendAll() {
    const unpaid = filtered.filter(inv => inv.status === 'unpaid')
    for (const inv of unpaid) await sendReminder(inv)
  }

  const filtered = invoices.filter(inv => filter === 'all' ? true : inv.status === filter)
  const unpaidCount = filtered.filter(inv => inv.status === 'unpaid').length

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 transition-all">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tagihan</h1>
        {unpaidCount > 0 && (
          <Button onClick={sendAll} size="sm" variant="outline">
            <Send size={14} className="mr-1" />
            Kirim Reminder Massal ({unpaidCount})
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'unpaid', 'paid'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? `Semua (${invoices.length})` : f === 'unpaid' ? `Belum Lunas (${invoices.filter(i => i.status === 'unpaid').length})` : `Lunas (${invoices.filter(i => i.status === 'paid').length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border divide-y">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-gray-400">Tidak ada tagihan.</p>
        )}
        {filtered.map(inv => (
          <div key={inv.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">{inv.tenants?.name ?? '—'}</p>
                <p className="text-xs text-gray-400">
                  Kamar {inv.tenants?.rooms?.room_number ?? '-'} · Jatuh tempo: {inv.due_date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold">Rp {inv.amount.toLocaleString('id-ID')}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {inv.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
                {inv.status !== 'paid' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewId(previewId === inv.id ? null : inv.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      title="Preview pesan WA"
                    >
                      {previewId === inv.id ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={() => sendReminder(inv)}
                      disabled={sending === inv.id}
                      className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-md px-2 py-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send size={12} />
                      {sending === inv.id ? 'Mengirim...' : 'Kirim WA'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {previewId === inv.id && (
              <div className="bg-[#dcf8c6] rounded-lg p-3 text-sm text-gray-800 whitespace-pre-line border border-green-200 ml-4">
                <p className="text-xs text-gray-500 mb-1.5 font-medium">Preview pesan WhatsApp:</p>
                {previewMessage(inv)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
