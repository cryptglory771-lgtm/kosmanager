'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical, Send, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type InvoiceWithTenant = {
  id: string
  amount: number
  due_date: string
  status: string
  tenants: {
    name: string
    phone: string
    rooms: {
      room_number: string
      properties: { name: string } | null
    } | null
  } | null
}

type TemplateKey = 'h7' | 'h3' | 'overdue' | 'manual'

// ── Constants ──────────────────────────────────────────────────────────────
const WA_GREEN  = '#075E54'
const WA_LIGHT  = '#128C7E'
const WA_BG     = '#DAF0E9'

const TEMPLATES: { key: TemplateKey; label: string }[] = [
  { key: 'h7',      label: 'H-7' },
  { key: 'h3',      label: 'H-3' },
  { key: 'overdue', label: 'H+1 Terlambat' },
  { key: 'manual',  label: 'Sambutan' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatDate(s: string) {
  return format(new Date(s), 'd MMMM yyyy', { locale: localeId })
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function templateSubtitle(t: TemplateKey) {
  if (t === 'h7')      return 'Tagihan jatuh tempo 7 hari lagi'
  if (t === 'h3')      return 'Tagihan jatuh tempo 3 hari lagi'
  if (t === 'overdue') return 'Tagihan sudah melewati jatuh tempo ⚠️'
  return 'Ini pengingat tagihan bulan ini'
}

// ── Message Bubble ─────────────────────────────────────────────────────────
function MessageBubble({ inv, template }: { inv: InvoiceWithTenant; template: TemplateKey }) {
  const firstName = (inv.tenants?.name ?? '').split(' ')[0]
  const room      = inv.tenants?.rooms?.room_number ?? '—'
  const property  = inv.tenants?.rooms?.properties?.name ?? 'Kos'
  const month     = format(new Date(inv.due_date), 'MMMM yyyy', { locale: localeId })
  const now       = new Date()
  const timeStr   = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const emoji     = template === 'overdue' ? '😟' : '👋'

  return (
    <div className="px-3 py-4">
      {/* Date separator */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-[11px] text-gray-500 font-medium bg-white/70 px-3 py-1 rounded-full shadow-sm">
          Hari ini
        </span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      {/* Bubble */}
      <div className="max-w-[88%]">
        {/* Triangle notch */}
        <div
          className="w-0 h-0 ml-3"
          style={{ borderRight: '8px solid white', borderTop: '8px solid transparent', borderBottom: '0' }}
        />
        <div className="bg-white rounded-2xl rounded-tl-none shadow-sm overflow-hidden -mt-px">
          {/* Header strip */}
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: WA_GREEN }}>
            <span className="text-lg">🏠</span>
            <span className="text-white font-bold text-sm">Tagihan Kos – {month}</span>
          </div>

          {/* Body */}
          <div className="px-4 pt-3 pb-2 space-y-3">
            {/* Greeting */}
            <div>
              <p className="text-sm font-bold text-gray-900">Halo Kak {firstName} {emoji}</p>
              <p className="text-xs text-gray-500 mt-0.5">{templateSubtitle(template)}</p>
            </div>

            {/* Amount */}
            <div className="bg-green-50 rounded-xl px-3 py-2.5 border border-green-100">
              <p className="text-[9px] font-black text-green-700 uppercase tracking-widest mb-1">Total Tagihan</p>
              <p className="font-display font-black text-green-800 text-2xl leading-none tracking-tight">
                {formatRp(inv.amount)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-600">
                <span className="mr-1.5">📅</span>
                Jatuh tempo:{' '}
                <span className="font-bold text-gray-900">{formatDate(inv.due_date)}</span>
              </p>
              <p className="text-xs text-gray-600">
                <span className="mr-1.5">🏠</span>
                {property} · Kamar {room}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100" />

            {/* CTA button */}
            <div
              className="rounded-xl px-3 py-2.5 flex items-center gap-2"
              style={{ backgroundColor: WA_GREEN }}
            >
              <span className="text-sm">👆</span>
              <span className="text-white font-bold text-sm">Bayar Sekarang</span>
            </div>

            {/* Timestamp */}
            <div className="flex justify-end pb-1">
              <span className="text-[10px] text-gray-400">{timeStr} ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Recipient Chip ─────────────────────────────────────────────────────────
function RecipientChip({
  inv, active, onClick,
}: { inv: InvoiceWithTenant; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95',
        active ? 'text-white' : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
      )}
      style={active ? { backgroundColor: WA_GREEN } : undefined}
    >
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
        style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#E8F5F2', color: active ? 'white' : WA_GREEN }}
      >
        {initials(inv.tenants?.name ?? '??')}
      </span>
      {(inv.tenants?.name ?? '').split(' ')[0] || '—'}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function RemindPage() {
  const router = useRouter()
  const { selectedId } = useProperty()

  const [invoices,  setInvoices]  = useState<InvoiceWithTenant[]>([])
  const [preview,   setPreview]   = useState<InvoiceWithTenant | null>(null)
  const [template,  setTemplate]  = useState<TemplateKey>('manual')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    const q = supabase
      .from('invoices')
      .select('id, amount, due_date, status, tenants!inner(name, phone, rooms!inner(room_number, properties(name)))')
      .neq('status', 'paid')
      .eq('tenants.rooms.property_id', selectedId)
      .order('due_date', { ascending: true })
    q.then(({ data }) => {
      const invs = (data ?? []) as unknown as InvoiceWithTenant[]
      setInvoices(invs)
      if (invs.length > 0) setPreview(invs[0])
      setLoading(false)
    })
  }, [selectedId])

  async function sendAll() {
    if (sending || invoices.length === 0) return
    setSending(true)
    for (const inv of invoices) {
      try {
        await fetch('/api/invoices/send-reminder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceId: inv.id, templateType: template }),
        })
      } catch {
        // continue to next invoice even if one fails
      }
    }
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const displayed = preview ?? invoices[0] ?? null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: WA_BG }}>

      {/* ── WA-Style Header ──────────────────────────────── */}
      <div
        className="px-4 pt-5 pb-3 flex items-center gap-3 sticky top-0 z-30 shadow-md"
        style={{ backgroundColor: WA_GREEN }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>

        {loading ? (
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-white/20 animate-pulse" />
            <div className="h-2.5 w-24 rounded bg-white/15 animate-pulse" />
          </div>
        ) : displayed ? (
          <>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black text-white"
              style={{ backgroundColor: WA_LIGHT }}
            >
              {initials(displayed.tenants?.name ?? '??')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">
                {displayed.tenants?.name ?? '—'}
              </p>
              <p className="text-[11px] font-medium leading-tight truncate" style={{ color: '#25D366' }}>
                Kamar {displayed.tenants?.rooms?.room_number ?? '—'} · {displayed.tenants?.phone ?? ''}
              </p>
            </div>
          </>
        ) : (
          <p className="flex-1 text-white font-bold text-sm">Preview Pesan</p>
        )}

        <button
          className="w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20 transition-colors"
          aria-label="Opsi"
        >
          <MoreVertical size={18} className="text-white" />
        </button>
      </div>

      {/* ── Chat Area ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <span
              className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${WA_GREEN} transparent ${WA_GREEN} ${WA_GREEN}` }}
            />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2">
            <p className="text-3xl">🎉</p>
            <p className="text-sm text-gray-600 font-bold">Semua tagihan sudah lunas!</p>
            <p className="text-xs text-gray-400">Tidak ada yang perlu diingatkan</p>
          </div>
        ) : displayed ? (
          <MessageBubble inv={displayed} template={template} />
        ) : null}

        {/* Recipient picker (when multiple) */}
        {!loading && invoices.length > 1 && (
          <div className="px-3 pb-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500/80 mb-2 px-1">
              Preview untuk penyewa
            </p>
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              {invoices.map(inv => (
                <RecipientChip
                  key={inv.id}
                  inv={inv}
                  active={preview?.id === inv.id}
                  onClick={() => setPreview(inv)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Panel ─────────────────────────────────── */}
      <div className="bg-white border-t border-gray-100 px-4 pt-4 pb-safe md:pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* Template label */}
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2.5">
          Template Pesan
        </p>

        {/* Template chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-3">
          {TEMPLATES.map(t => (
            <button
              key={t.key}
              onClick={() => setTemplate(t.key)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 transition-all active:scale-95',
                template === t.key
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              style={template === t.key ? { backgroundColor: WA_GREEN, borderColor: WA_GREEN } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Recipient count */}
        {invoices.length > 0 && (
          <p className="text-sm text-gray-500 mb-3">
            Kirim ke:{' '}
            <span className="font-bold text-gray-900">
              {invoices.length} penyewa belum bayar
            </span>
          </p>
        )}

        {/* Send button */}
        <button
          onClick={sendAll}
          disabled={sending || invoices.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm',
            'transition-all duration-150 active:scale-[0.98]',
            sent
              ? 'bg-green-600 text-white'
              : sending || invoices.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 hover:bg-amber-400'
          )}
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : sent ? (
            <Check size={15} />
          ) : (
            <Send size={15} />
          )}
          {sending
            ? 'Mengirim...'
            : sent
              ? `✓ ${invoices.length} Reminder Berhasil Dikirim`
              : invoices.length === 0
                ? 'Tidak ada tagihan tertunggak'
                : `📤 Kirim ke ${invoices.length} Penyewa via WA`
          }
        </button>
      </div>
    </div>
  )
}
