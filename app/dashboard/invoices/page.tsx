'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Send, Check, X, Banknote, Building2, Smartphone } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
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

type PayMethod = 'cash' | 'transfer' | 'qris'

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

// ── Payment Sheet ──────────────────────────────────────────────────────────
const PAY_METHODS: { key: PayMethod; icon: React.ElementType; label: string; sub: string }[] = [
  { key: 'cash',     icon: Banknote,   label: 'Tunai',        sub: 'Bayar langsung' },
  { key: 'transfer', icon: Building2,  label: 'Transfer Bank', sub: 'ATM / m-Banking' },
  { key: 'qris',     icon: Smartphone, label: 'QRIS',         sub: 'GoPay, OVO, Dana' },
]

function PaymentSheet({
  inv, method, note, confirming,
  onMethodChange, onNoteChange, onConfirm, onClose,
}: {
  inv: Invoice
  method: PayMethod
  note: string
  confirming: boolean
  onMethodChange: (m: PayMethod) => void
  onNoteChange: (n: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  const name   = inv.tenants?.name ?? '—'
  const room   = inv.tenants?.rooms?.room_number ?? '—'
  const dueStr = format(new Date(inv.due_date), 'd MMMM yyyy', { locale: localeId })

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-safe md:pb-6">
          {/* Title */}
          <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
            <p className="font-display font-bold text-base text-gray-900">Konfirmasi Pembayaran</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Invoice summary */}
          <div className="bg-green-50 rounded-2xl border border-green-100 p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-white">
                  {name.trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">Kamar {room} · J.T. {dueStr}</p>
              </div>
            </div>
            <div className="border-t border-green-100 pt-3">
              <p className="text-[10px] font-black text-green-700 uppercase tracking-wider mb-0.5">Total Pembayaran</p>
              <p className="font-display font-black text-green-800 text-2xl tracking-tight leading-none">
                Rp {inv.amount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Payment method */}
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2.5">Metode Pembayaran</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PAY_METHODS.map(({ key, icon: Icon, label, sub }) => (
              <button
                key={key}
                onClick={() => onMethodChange(key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all active:scale-95',
                  method === key
                    ? 'bg-green-800 border-green-800 text-white'
                    : 'bg-white border-gray-200 text-gray-600'
                )}
              >
                <Icon size={18} />
                <span className="text-[11px] font-bold leading-tight text-center">{label}</span>
                <span className={cn(
                  'text-[9px] leading-tight text-center',
                  method === key ? 'text-green-200' : 'text-gray-400'
                )}>
                  {sub}
                </span>
              </button>
            ))}
          </div>

          {/* Note */}
          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
            Catatan <span className="normal-case font-medium text-gray-300">(opsional)</span>
          </p>
          <textarea
            rows={2}
            placeholder="Misal: Bayar cash di tangan…"
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-600 transition-colors resize-none mb-5"
            style={{ fontSize: '16px' }}
          />

          {/* Confirm button */}
          <button
            onClick={onConfirm}
            disabled={confirming}
            className={cn(
              'w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
              confirming
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-800 text-white active:scale-[0.98]'
            )}
          >
            {confirming
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <Check size={15} />
            }
            {confirming ? 'Menyimpan...' : '✓ Tandai Lunas'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Invoice Row ────────────────────────────────────────────────────────────
function InvoiceRow({
  inv, index, onSend, sending, onMarkPaid,
}: {
  inv: Invoice
  index: number
  onSend: (inv: Invoice) => void
  sending: string | null
  onMarkPaid: (inv: Invoice) => void
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
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onMarkPaid(inv)}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                'bg-green-700 text-white',
                'hover:bg-green-600 active:scale-95 transition-all duration-100'
              )}
              aria-label={`Tandai lunas ${name}`}
            >
              <Check size={13} />
            </button>
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
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { selectedId, selected } = useProperty()
  const [invoices,     setInvoices]     = useState<Invoice[]>([])
  const [filter,       setFilter]       = useState<FilterKey>('semua')
  const [sending,      setSending]      = useState<string | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [payingInv,    setPayingInv]    = useState<Invoice | null>(null)
  const [payMethod,    setPayMethod]    = useState<PayMethod>('cash')
  const [payNote,      setPayNote]      = useState('')
  const [confirming,   setConfirming]   = useState(false)
  const filterBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('invoices')
      .select('id, amount, due_date, status, tenants!inner(name, phone, rooms!inner(room_number, properties(name)))')
      .eq('tenants.rooms.property_id', selectedId)
      .order('due_date', { ascending: true })
      .then(({ data }) => {
        setInvoices((data ?? []) as unknown as Invoice[])
        setLoading(false)
      })
  }, [selectedId])

  function showToast(msg: string, type: 'ok' | 'err') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function sendReminder(inv: Invoice) {
    if (!inv.tenants) return
    setSending(inv.id)
    try {
      const res  = await fetch('/api/invoices/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: inv.id }),
      })
      const data = await res.json().catch(() => ({ ok: false }))
      if (data.ok) {
        showToast(`✓ Terkirim ke ${inv.tenants.name}`, 'ok')
      } else {
        showToast(`✗ Gagal kirim ke ${inv.tenants.name}`, 'err')
      }
    } catch {
      showToast(`✗ Gagal kirim ke ${inv.tenants.name}`, 'err')
    } finally {
      setSending(null)
    }
  }

  function openPayment(inv: Invoice) {
    setPayingInv(inv)
    setPayMethod('cash')
    setPayNote('')
  }

  async function markPaid() {
    if (!payingInv) return
    setConfirming(true)
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', payingInv.id)
    setConfirming(false)
    if (!error) {
      setInvoices(prev => prev.map(inv => inv.id === payingInv.id ? { ...inv, status: 'paid' } : inv))
      showToast(`✓ ${payingInv.tenants?.name ?? 'Tagihan'} — Lunas`, 'ok')
    } else {
      showToast('✗ Gagal memperbarui tagihan', 'err')
    }
    setPayingInv(null)
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
          {selected?.name ?? 'Tagihan'} · {month} {year}
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
          <Link
            href="/dashboard/invoices/remind"
            className="flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap active:scale-[0.97] transition-all duration-100 shrink-0"
          >
            <Send size={12} />
            Kirim Semua
          </Link>
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
                onMarkPaid={openPayment}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Payment Sheet ───────────────────────────────────── */}
      {payingInv && (
        <PaymentSheet
          inv={payingInv}
          method={payMethod}
          note={payNote}
          confirming={confirming}
          onMethodChange={setPayMethod}
          onNoteChange={setPayNote}
          onConfirm={markPaid}
          onClose={() => setPayingInv(null)}
        />
      )}

      {/* ── Floating Button (mobile) ─────────────────────────── */}
      {!loading && unpaidInvoices.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 z-30 md:hidden">
          <Link
            href="/dashboard/invoices/remind"
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'bg-amber-500 text-white font-bold text-sm',
              'py-3.5 rounded-2xl shadow-lg shadow-amber-500/30',
              'active:scale-[0.98] transition-all duration-150'
            )}
          >
            <Send size={15} />
            {`📤 Kirim Reminder Sekarang (${unpaidInvoices.length})`}
          </Link>
        </div>
      )}
    </div>
  )
}
