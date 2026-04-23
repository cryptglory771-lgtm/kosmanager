import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export default async function PayPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, amount, due_date, status, payment_url, tenants(name, rooms(room_number, properties(name)))')
    .eq('id', invoiceId)
    .single()

  if (!invoice) notFound()

  const tenant = invoice.tenants as any
  const room = tenant?.rooms
  const property = room?.properties

  const isPaid = invoice.status === 'paid'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">🏠 {property?.name ?? 'KosManager'}</h1>
          <p className="text-sm text-gray-500 mt-1">Detail Tagihan Sewa</p>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Nama" value={tenant?.name ?? '—'} />
          <Row label="Kamar" value={room?.room_number ? `Kamar ${room.room_number}` : '—'} />
          <Row label="Jatuh Tempo" value={invoice.due_date} />
          <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
            <span className="font-semibold text-gray-700">Total Tagihan</span>
            <span className="font-bold text-lg text-gray-900">Rp {invoice.amount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {isPaid ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-semibold">✓ Tagihan Sudah Lunas</p>
            <p className="text-green-600 text-sm mt-1">Terima kasih atas pembayaran kamu!</p>
          </div>
        ) : invoice.payment_url ? (
          <a
            href={invoice.payment_url}
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 rounded-xl transition-colors"
          >
            Bayar Sekarang
          </a>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-700 text-sm">Link pembayaran belum tersedia. Hubungi pemilik kos.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">KosManager · Sistem Manajemen Kos Otomatis</p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  )
}
