'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Send, Calendar, Home, Clock, Wallet, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/shared/avatar'
import { Badge } from '@/components/shared/badge'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ── Types ──────────────────────────────────────────────────────────────────
type Tenant = {
  id: string
  name: string
  phone: string
  email: string | null
  start_date: string
  end_date: string
  rooms: {
    room_number: string
    monthly_price: number
    properties: { name: string } | null
  } | null
}

type Invoice = {
  id: string
  amount: number
  due_date: string
  status: string
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function daysLeft(dateStr: string) {
  const end = new Date(dateStr)
  const now = new Date()
  end.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'd MMMM yyyy', { locale: localeId })
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function monthLabel(dateStr: string) {
  return format(new Date(dateStr), 'MMM', { locale: localeId }).toUpperCase()
}

function monthFull(dateStr: string) {
  return format(new Date(dateStr), 'MMMM yyyy', { locale: localeId })
}

// ── Detail Row ─────────────────────────────────────────────────────────────
function DetailRow({
  icon: Icon, label, value, highlight = false,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
        <Icon size={13} className="text-green-700" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 w-20 shrink-0">
        {label}
      </span>
      <span className={cn('text-sm font-bold ml-auto text-right', highlight ? 'text-green-700' : 'text-gray-800')}>
        {value}
      </span>
    </div>
  )
}

// ── Invoice History Row ────────────────────────────────────────────────────
function InvoiceHistoryRow({ inv, index }: { inv: Invoice; index: number }) {
  const isPaid = inv.status === 'paid'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Month badge */}
      <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex flex-col items-center justify-center shrink-0">
        <span className="text-[9px] font-black text-green-700 leading-none uppercase">
          {monthLabel(inv.due_date)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900">{monthFull(inv.due_date)}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
          {isPaid ? 'Sudah dibayar' : `Jatuh tempo ${formatDate(inv.due_date)}`}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold text-gray-800">{formatRp(inv.amount)}</span>
        <Badge variant={isPaid ? 'lunas' : 'belum'} />
      </div>
    </div>
  )
}

// ── Skeleton States ────────────────────────────────────────────────────────
function TenantHeaderSkeleton() {
  return (
    <div className="bg-green-800 px-4 md:px-8 pt-14 pb-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-2xl bg-white/10" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-36 bg-white/10" />
          <Skeleton className="h-3.5 w-24 bg-white/10" />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function TenantDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string

  const [tenant,   setTenant]   = useState<Tenant | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: invs }] = await Promise.all([
        supabase
          .from('tenants')
          .select('id, name, phone, email, start_date, end_date, rooms(room_number, monthly_price, properties(name))')
          .eq('id', id)
          .single(),
        supabase
          .from('invoices')
          .select('id, amount, due_date, status, created_at')
          .eq('tenant_id', id)
          .order('due_date', { ascending: false }),
      ])
      setTenant(t as unknown as Tenant)
      setInvoices(invs ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  async function sendReminder() {
    if (!tenant) return
    const unpaid = invoices.find(i => i.status !== 'paid')
    if (!unpaid) return
    setSending(true)
    await fetch('/api/invoices/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: unpaid.id }),
    })
    setSending(false)
  }

  const days    = tenant ? daysLeft(tenant.end_date) : 0
  const isOver  = days < 0
  const isNear  = days >= 0 && days <= 30
  const roomNum = tenant?.rooms?.room_number ?? '—'
  const price   = tenant?.rooms?.monthly_price ?? 0

  return (
    <div className="min-h-screen bg-cream pb-28 md:pb-8">

      {/* ── Green Header ──────────────────────────────────── */}
      {loading ? <TenantHeaderSkeleton /> : tenant ? (
        <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-6">
          {/* Back button + title */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
              aria-label="Kembali"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
            <div>
              <p className="text-white/60 text-xs font-medium">Detail Penyewa</p>
              <p className="text-white font-bold text-sm">Kamar {roomNum}</p>
            </div>
          </div>

          {/* Tenant identity */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-green-400/20 border-2 border-green-400/40 flex items-center justify-center shrink-0">
              <span className="font-display font-black text-white text-lg">
                {initials(tenant.name)}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="font-display font-black text-white text-xl tracking-tight leading-tight">
                {tenant.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-green-200 text-xs font-medium">
                  Kamar {roomNum}
                </p>
                <span className="text-green-400">·</span>
                <Badge
                  variant={isOver ? 'belum' : isNear ? 'hampir' : 'aktif'}
                  label={isOver ? 'Kontrak habis' : isNear ? `Sisa ${days} hari` : '● Aktif'}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-800 px-4 pt-5 pb-6 h-40" />
      )}

      <div className="px-4 md:px-8 py-4 space-y-4">

        {/* ── Detail Card ─────────────────────────────────── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            {[80, 60, 64, 72, 56, 48].map((w, i) => (
              <Skeleton key={i} className={`h-8 w-${w} rounded-xl`} />
            ))}
          </div>
        ) : tenant && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-up">
            <div className="px-4 py-1">
              <DetailRow
                icon={Phone}
                label="No. WA"
                value={
                  <a
                    href={`https://wa.me/${tenant.phone.replace(/^0/, '62')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 underline underline-offset-2"
                  >
                    {tenant.phone}
                  </a>
                }
              />
              <DetailRow icon={Wallet}   label="Sewa/Bln" value={formatRp(price)}          highlight />
              <DetailRow icon={Calendar} label="Masuk"    value={formatDate(tenant.start_date)} />
              <DetailRow icon={Home}     label="Kontrak"  value={`s/d ${formatDate(tenant.end_date)}`} />
              <DetailRow
                icon={Clock}
                label="Sisa"
                value={
                  isOver
                    ? <span className="text-red-600">{Math.abs(days)} hari (habis)</span>
                    : isNear
                      ? <span className="text-amber-600">{days} hari lagi</span>
                      : `${days} hari`
                }
                highlight={isNear}
              />
            </div>
          </div>
        )}

        {/* ── Invoice History ──────────────────────────────── */}
        <div>
          <h2 className="font-display font-bold text-base text-gray-900 tracking-tight mb-3">
            Riwayat Tagihan
          </h2>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-1.5 flex flex-col items-end">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-10 flex flex-col items-center gap-2">
              <p className="text-2xl">📋</p>
              <p className="text-sm text-gray-400 font-medium">Belum ada tagihan</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
              {invoices.map((inv, i) => (
                <InvoiceHistoryRow key={inv.id} inv={inv} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Action Bar ────────────────────────────── */}
      {!loading && tenant && (
        <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 md:left-60 bg-white border-t border-gray-200 px-4 md:px-8 py-3 flex gap-3 z-30">
          <a
            href={`https://wa.me/${tenant.phone.replace(/^0/, '62')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-green-800 text-green-800 font-bold text-sm hover:bg-green-50 active:scale-[0.97] transition-all"
          >
            <MessageCircle size={15} />
            Hubungi WA
          </a>
          <button
            onClick={sendReminder}
            disabled={sending || !invoices.some(i => i.status !== 'paid')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]',
              sending || !invoices.some(i => i.status !== 'paid')
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-800 text-white hover:bg-green-700'
            )}
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <Send size={15} />
            }
            {sending ? 'Mengirim...' : 'Kirim Tagihan'}
          </button>
        </div>
      )}
    </div>
  )
}
