'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Check, X, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/shared/avatar'
import { Badge } from '@/components/shared/badge'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type Invoice = {
  id: string
  amount: number
  due_date: string
  status: string
  tenants: {
    name: string
    phone: string
    rooms: { room_number: string; properties: { name: string } } | null
  } | null
}

type FilterKey = 'semua' | 'lunas' | 'belum' | 'hampir'

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
]

function daysDiff(dateStr: string) {
  const due = new Date(dateStr)
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}jt`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatRpFull(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function isHampir(inv: Invoice) {
  const d = daysDiff(inv.due_date)
  return inv.status !== 'paid' && d >= 0 && d <= 7
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'ok' | 'err' }) {
  return (
    <div className={cn(
      'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2',
      'px-4 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white animate-fade-in',
      'max-w-[90vw] whitespace-nowrap',
      type === 'ok' ? 'bg-green-800' : 'bg-red-600'
    )}>
      {type === 'ok' ? <Check size={14} /> : <X size={14} />}
      {msg}
    </div>
  )
}

// ── Invoice Row ────────────────────────────────────────────────────────────
function InvoiceRow({
  inv, index, onSend, sending,
}: {
  inv: Invoice
  index: number
  onSend: (inv: Invoice) => void
  sending: string | null
}) {
  const name    = inv.tenants?.name ?? '—'
  const room    = inv.tenants?.rooms?.room_number ?? '—'
  const days    = daysDiff(inv.due_date)
  const isPaid  = inv.status === 'paid'
  const isSending = sending === inv.id

  const badgeVariant = isPaid ? 'lunas' : days < 0 ? 'belum' : days <= 3 ? 'hampir' : 'belum'
  const badgeLabel   = isPaid
    ? 'Lunas ✓'
    : days < 0
      ? `Terlambat ${Math.abs(days)}h`
      : days === 0 ? 'Hari ini!' : days <= 7 ? `${days} hari lagi` : 'Belum'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Avatar initials={initials(name)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
          Kamar {room} · {isPaid ? 'Lunas' : `J.T. ${inv.due_date}`}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800">{formatRp(inv.amount)}</p>
          <div className="flex justify-end mt-1">
            <Badge variant={badgeVariant} label={badgeLabel} />
          </div>
        </div>

        {!isPaid && (
          <button
            onClick={() => onSend(inv)}
            disabled={isSending}
            className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
              'bg-green-50 text-green-700 border border-green-200',
              'hover:bg-green-100 active:scale-95 transition-all duration-100',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label={`Kirim reminder ke ${name}`}
          >
            {isSending
              ? <span className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              : <Send size={13} />
            }
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filter,   setFilter]   = useState<FilterKey>('semua')
  const [sending,  setSending]  = useState<string | null>(null)
  const [sendingAll, setSendingAll] = useState(false)
  const [toast,    setToast]    = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [loading,  setLoading]  = useState(true)
  const filterBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase
      .from('invoices')
      .select('id, amount, due_date, status, tenants(name, phone, rooms(room_number, properties(name)))')
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        setInvoices((data ?? []) as unknown as Invoice[])
        setLoading(false)
      })
  }, [])

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function sendReminder(inv: Invoice) {
    if (!inv.tenants) return
    setSending(inv.id)
    const res  = await fetch('/api/invoices/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: inv.id }),
    })
    const data = await res.json()
    setSending(null)
    if (data.ok) {
      showToast(`✓ Terkirim ke ${inv.tenants.name}`, 'ok')
    } else {
      showToast(`✗ Gagal kirim ke ${inv.tenants.name}`, 'err')
    }
  }

  async function sendAll() {
    const targets = unpaidInvoices
    if (!targets.length) return
    setSendingAll(true)
    for (const inv of targets) await sendReminder(inv)
    setSendingAll(false)
    showToast(`✓ ${targets.length} reminder terkirim`, 'ok')
  }

  // ── Derived state ──
  const now   = new Date()
  const month = MONTHS_ID[now.getMonth()]
  const year  = now.getFullYear()

  const totalAmount    = invoices.reduce((s, i) => s + i.amount, 0)
  const paidInvoices   = invoices.filter(i => i.status === 'paid')
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid')
  const hampirInvoices = invoices.filter(isHampir)

  const chips: { key: FilterKey; label: string; count: number }[] = [
    { key: 'semua',  label: 'Semua',            count: invoices.length },
    { key: 'lunas',  label: 'Lunas',            count: paidInvoices.length },
    { key: 'belum',  label: 'Belum Bayar',      count: unpaidInvoices.length },
    { key: 'hampir', label: 'Hampir Jatuh Tempo', count: hampirInvoices.length },
  ]

  const filtered = invoices.filter(inv => {
    if (filter === 'lunas')  return inv.status === 'paid'
    if (filter === 'belum')  return inv.status !== 'paid'
    if (filter === 'hampir') return isHampir(inv)
    return true
  })

  const showActionBar = unpaidInvoices.length > 0 && (filter === 'semua' || filter === 'belum')

  return (
    <div className="min-h-screen pb-32 md:pb-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Green Header ────────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-5">
        <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">
          Tagihan · {month} {year}
        </p>
        <p className="font-display font-black text-white text-3xl md:text-4xl tracking-tight mb-4">
          {loading
            ? <span className="inline-block w-40 h-9 bg-white/10 rounded-xl animate-pulse" />
            : formatRpFull(totalAmount)
          }
        </p>

        {/* Stat ringkasan */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[0,1,2].map(i => (
              <div key={i} className="h-10 rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[
              { label: 'Total',  value: invoices.length,        dot: 'bg-white/40'  },
              { label: 'Lunas',  value: paidInvoices.length,    dot: 'bg-green-400' },
              { label: 'Belum',  value: unpaidInvoices.length,  dot: 'bg-red-400'   },
            ].map(s => (
              <div
                key={s.label}
                className="bg-white/10 border border-white/15 rounded-xl px-2.5 py-2 flex items-center gap-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                <div>
                  <p className="font-display font-black text-white text-base leading-none">{s.value}</p>
                  <p className="text-[10px] text-white/50 font-medium mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Action Bar ──────────────────────────────────────── */}
      {!loading && showActionBar && (
        <div className="bg-amber-light border-b border-amber-soft px-4 md:px-8 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-amber-900">
              📤 Kirim reminder ke {unpaidInvoices.length} penyewa
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">Belum bayar · via WhatsApp</p>
          </div>
          <button
            onClick={sendAll}
            disabled={sendingAll}
            className={cn(
              'flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold',
              'px-3 py-2 rounded-xl whitespace-nowrap active:scale-[0.97]',
              'transition-all duration-100 disabled:opacity-60 shrink-0'
            )}
          >
            {sendingAll
              ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send size={12} />
            }
            {sendingAll ? 'Mengirim...' : 'Kirim Semua'}
          </button>
        </div>
      )}

      {/* ── Filter Chips ─────────────────────────────────────── */}
      <div
        ref={filterBarRef}
        className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 md:px-8 py-2.5 overflow-x-auto scrollbar-none"
      >
        <div className="flex gap-2 min-w-max">
          {chips.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap',
                'transition-all duration-150 active:scale-95',
                filter === c.key
                  ? 'bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              {c.label}
              {c.count > 0 && (
                <span className={cn(
                  'text-[9px] font-black px-1.5 py-0.5 rounded-full',
                  filter === c.key ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-600'
                )}>
                  {c.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Invoice List ─────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-4">
        {loading ? (
          <CardSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 flex flex-col items-center gap-2">
            <p className="text-2xl">📋</p>
            <p className="text-sm font-bold text-gray-500">
              {filter === 'lunas'  ? 'Belum ada tagihan lunas'
               : filter === 'belum'  ? 'Semua tagihan sudah lunas! 🎉'
               : filter === 'hampir' ? 'Tidak ada tagihan hampir jatuh tempo'
               : 'Belum ada tagihan bulan ini'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
            {filtered.map((inv, i) => (
              <InvoiceRow
                key={inv.id}
                inv={inv}
                index={i}
                onSend={sendReminder}
                sending={sending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Button (mobile) ─────────────────────────── */}
      {!loading && unpaidInvoices.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 z-30 md:hidden">
          <button
            onClick={sendAll}
            disabled={sendingAll}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'bg-amber-500 text-white font-bold text-sm',
              'py-3.5 rounded-2xl shadow-lg shadow-amber-500/30',
              'active:scale-[0.98] transition-all duration-150',
              'disabled:opacity-70'
            )}
          >
            {sendingAll
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send size={15} />
            }
            {sendingAll
              ? 'Mengirim...'
              : `📤 Kirim Reminder Sekarang (${unpaidInvoices.length})`
            }
          </button>
        </div>
      )}
    </div>
  )
}
