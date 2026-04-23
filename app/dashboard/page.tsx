'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Send, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/shared/avatar'
import { Badge } from '@/components/shared/badge'
import { CardSkeleton, RoomTileSkeleton, StatCardSkeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type Room = {
  id: string
  room_number: string
  status: string
  monthly_price: number
}

type Invoice = {
  id: string
  amount: number
  due_date: string
  status: string
  tenants: { name: string; rooms: { room_number: string } | null } | null
}

type Stats = {
  totalRooms: number
  occupiedRooms: number
  monthlyIncome: number
  unpaidCount: number
  unpaidDaysLeft: number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 18) return 'Selamat sore'
  return 'Selamat malam'
}

function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function daysDiff(dateStr: string) {
  const due  = new Date(dateStr)
  const now  = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000)
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── Sub-components ─────────────────────────────────────────────────────────
function HeaderStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 rounded-2xl p-3 md:p-4">
      <p className="font-display font-black text-white text-xl md:text-2xl leading-none tracking-tight">
        {value}
      </p>
      <p className="text-green-200 text-[11px] font-medium mt-1 leading-tight">{label}</p>
    </div>
  )
}

function RoomTile({ room, index }: { room: Room; index: number }) {
  const style: Record<string, string> = {
    occupied:    'bg-green-100 border-green-200 text-green-800',
    empty:       'bg-red-100 border-red-200 text-red-600',
    maintenance: 'bg-amber-light border-amber-soft text-amber-700',
  }
  const label: Record<string, string> = {
    occupied: 'Terisi', empty: 'Kosong', maintenance: 'Perbaikan',
  }

  return (
    <Link
      href="/dashboard/rooms"
      className={cn(
        'aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5',
        'active:scale-[0.93] transition-transform duration-100',
        'animate-fade-up',
        style[room.status] ?? style.empty
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className="font-display font-black text-sm leading-none">{room.room_number}</span>
      <span className="text-[9px] font-bold leading-none opacity-70">
        {label[room.status] ?? 'Kosong'}
      </span>
    </Link>
  )
}

function InvoiceRow({ inv, index }: { inv: Invoice; index: number }) {
  const name     = inv.tenants?.name ?? '—'
  const roomNum  = inv.tenants?.rooms?.room_number ?? '—'
  const days     = daysDiff(inv.due_date)
  const isPaid   = inv.status === 'paid'

  const badgeVariant = isPaid
    ? 'lunas'
    : days < 0
      ? 'belum'
      : days <= 3
        ? 'hampir'
        : 'belum'

  const badgeLabel = isPaid
    ? 'Lunas ✓'
    : days < 0
      ? `Terlambat ${Math.abs(days)}h`
      : days === 0
        ? 'Hari ini!'
        : days <= 3
          ? `${days} hari lagi`
          : 'Belum'

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Avatar initials={initials(name)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Kamar {roomNum}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold text-gray-800">{formatRp(inv.amount)}</span>
        <Badge variant={badgeVariant} label={badgeLabel} />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [profileName, setProfileName] = useState('')
  const [rooms,       setRooms]       = useState<Room[]>([])
  const [invoices,    setInvoices]    = useState<Invoice[]>([])
  const [stats,       setStats]       = useState<Stats>({
    totalRooms: 0, occupiedRooms: 0, monthlyIncome: 0,
    unpaidCount: 0, unpaidDaysLeft: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: roomsData }, { data: invoicesData }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        supabase.from('rooms').select('id, room_number, status, monthly_price').order('room_number'),
        supabase
          .from('invoices')
          .select('id, amount, due_date, status, tenants(name, rooms(room_number))')
          .order('due_date', { ascending: true })
          .limit(5),
      ])

      const r = roomsData ?? []
      const invs = (invoicesData ?? []) as unknown as Invoice[]

      const occupied     = r.filter(x => x.status === 'occupied')
      const income       = occupied.reduce((s, x) => s + x.monthly_price, 0)
      const unpaid       = invs.filter(i => i.status !== 'paid')
      const minDays      = unpaid.length
        ? Math.min(...unpaid.map(i => daysDiff(i.due_date)))
        : null

      setProfileName(profile?.name ?? 'Pemilik')
      setRooms(r)
      setInvoices(invs)
      setStats({
        totalRooms:    r.length,
        occupiedRooms: occupied.length,
        monthlyIncome: income,
        unpaidCount:   unpaid.length,
        unpaidDaysLeft: minDays,
      })
      setLoading(false)
    }
    load()
  }, [])

  const firstName = profileName.split(' ')[0]

  return (
    <div className="min-h-screen">

      {/* ── Green Header ──────────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-8">

        {/* Greeting row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-green-300 text-sm font-medium">{greeting()},</p>
            <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight leading-tight mt-0.5">
              {loading ? (
                <span className="inline-block w-32 h-7 bg-white/10 rounded-lg animate-pulse" />
              ) : (
                <>{firstName} ☀️</>
              )}
            </h1>
          </div>
          <button
            className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors mt-1"
            aria-label="Notifikasi"
          >
            <Bell size={18} className="text-white" />
            {stats.unpaidCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber rounded-full" />
            )}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <HeaderStatCard label="Total Kamar"   value={stats.totalRooms} />
              <HeaderStatCard label="Terisi"         value={stats.occupiedRooms} />
              <HeaderStatCard label="Bulan Ini"      value={formatRp(stats.monthlyIncome)} />
            </>
          )}
        </div>
      </div>

      {/* ── Content Area ──────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-5 space-y-6">

        {/* Alert card — unpaid invoices */}
        {!loading && stats.unpaidCount > 0 && (
          <div className="bg-amber-light border border-amber-soft rounded-2xl p-4 flex items-start gap-3 animate-fade-up">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                {stats.unpaidCount} tagihan belum dibayar
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {stats.unpaidDaysLeft !== null && stats.unpaidDaysLeft < 0
                  ? 'Sudah melewati jatuh tempo!'
                  : stats.unpaidDaysLeft === 0
                    ? 'Jatuh tempo hari ini'
                    : `Paling cepat jatuh tempo ${stats.unpaidDaysLeft} hari lagi`}
              </p>
            </div>
            <Link
              href="/dashboard/invoices"
              className="flex items-center gap-1 bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap active:scale-[0.97] transition-transform shrink-0"
            >
              <Send size={11} />
              Reminder
            </Link>
          </div>
        )}

        {/* ── Room Grid ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-gray-900 tracking-tight">
              Status Kamar
            </h2>
            <Link
              href="/dashboard/rooms"
              className="flex items-center gap-0.5 text-xs font-bold text-green-700 active:opacity-70"
            >
              Lihat semua <ChevronRight size={13} />
            </Link>
          </div>

          {/* Legenda */}
          <div className="flex items-center gap-4 mb-3">
            {[
              { color: 'bg-green-400', label: 'Terisi' },
              { color: 'bg-red-400',   label: 'Kosong' },
              { color: 'bg-amber',     label: 'Perbaikan' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn('w-2 h-2 rounded-full', l.color)} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Tiles */}
          <div className="grid grid-cols-4 gap-2 md:grid-cols-6 lg:grid-cols-8">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <RoomTileSkeleton key={i} />)
              : rooms.length === 0
                ? (
                  <div className="col-span-4 py-8 flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-400 text-center">Belum ada kamar.</p>
                    <Link
                      href="/onboarding"
                      className="text-xs font-bold text-green-700 underline underline-offset-2"
                    >
                      Setup kamar sekarang →
                    </Link>
                  </div>
                )
                : rooms.map((room, i) => <RoomTile key={room.id} room={room} index={i} />)
            }
          </div>
        </section>

        {/* ── Invoice List ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base text-gray-900 tracking-tight">
              Tagihan Bulan Ini
            </h2>
            <Link
              href="/dashboard/invoices"
              className="flex items-center gap-0.5 text-xs font-bold text-green-700 active:opacity-70"
            >
              Lihat semua <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <CardSkeleton rows={3} />
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-10 flex flex-col items-center gap-2">
              <p className="text-sm text-gray-400">Belum ada tagihan bulan ini.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
              {invoices.map((inv, i) => (
                <InvoiceRow key={inv.id} inv={inv} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Spacer untuk bottom nav mobile */}
        <div className="h-2" />
      </div>
    </div>
  )
}
