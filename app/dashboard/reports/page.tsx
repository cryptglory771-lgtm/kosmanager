'use client'

import { useEffect, useState } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { FileText, Table2, Share2, TrendingUp, TrendingDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type MonthData = {
  shortLabel: string
  fullLabel: string
  income: number
  paidCount: number
  unpaidCount: number
  unpaidAmount: number
}

type RoomStats = {
  total: number
  occupied: number
  empty: number
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatRpFull(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

// ── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({
  value, label, sub, subColor = 'text-gray-400', index = 0,
}: {
  value: React.ReactNode
  label: string
  sub?: React.ReactNode
  subColor?: string
  index?: number
}) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="font-display font-black text-gray-900 text-2xl leading-none tracking-tight">{value}</p>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1.5">{label}</p>
      {sub && <p className={cn('text-[11px] font-medium mt-1', subColor)}>{sub}</p>}
    </div>
  )
}

// ── Bar Chart ──────────────────────────────────────────────────────────────
function BarChart({ months, loading }: { months: MonthData[]; loading: boolean }) {
  const max = Math.max(...months.map(m => m.income), 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 animate-fade-up" style={{ animationDelay: '120ms' }}>
      <p className="font-display font-bold text-sm text-gray-900 tracking-tight mb-5">
        Pemasukan 6 Bulan Terakhir
      </p>

      {loading ? (
        <div className="flex items-end gap-2 h-32">
          {[
            { h: 60 }, { h: 80 }, { h: 45 }, { h: 90 }, { h: 70 }, { h: 100 },
          ].map(({ h }, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-lg bg-gray-200 animate-pulse"
                style={{ height: `${h}%` }}
              />
              <div className="h-2.5 w-6 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2 h-32">
          {months.map((m, i) => {
            const isActive  = i === months.length - 1
            const heightPct = max > 0 ? Math.max((m.income / max) * 100, m.income > 0 ? 6 : 0) : 0

            return (
              <div key={m.shortLabel} className="flex-1 flex flex-col items-center gap-1.5">
                {m.income > 0 && (
                  <span className="text-[9px] font-black text-gray-500 leading-none">
                    {formatRp(m.income)}
                  </span>
                )}
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all duration-500',
                      isActive ? 'bg-green-800' : 'bg-green-200'
                    )}
                    style={{ height: `${heightPct}%`, minHeight: m.income > 0 ? '6px' : '0' }}
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-bold leading-none',
                  isActive ? 'text-green-800' : 'text-gray-400'
                )}>
                  {m.shortLabel}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressRow({
  label, amount, pct, color, index = 0,
}: {
  label: string
  amount: number
  pct: number
  color: string
  index?: number
}) {
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${180 + index * 50}ms` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-600">{label}</span>
        <span className="text-xs font-bold text-gray-900">{formatRp(amount)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [months,    setMonths]    = useState<MonthData[]>([])
  const [rooms,     setRooms]     = useState<RoomStats>({ total: 0, occupied: 0, empty: 0 })
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const monthDates = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))

      const [roomsRes, ...invoiceResults] = await Promise.all([
        supabase.from('rooms').select('id, status, monthly_price'),
        ...monthDates.map(m =>
          supabase
            .from('invoices')
            .select('amount, status')
            .gte('due_date', format(startOfMonth(m), 'yyyy-MM-dd'))
            .lte('due_date', format(endOfMonth(m), 'yyyy-MM-dd'))
        ),
      ])

      const allRooms    = roomsRes.data ?? []
      const occupied    = allRooms.filter(r => r.status === 'occupied').length
      setRooms({ total: allRooms.length, occupied, empty: allRooms.length - occupied })

      const parsed: MonthData[] = monthDates.map((m, i) => {
        const invs        = invoiceResults[i].data ?? []
        const paidInvs    = invs.filter(inv => inv.status === 'paid')
        const unpaidInvs  = invs.filter(inv => inv.status !== 'paid')
        return {
          shortLabel:   format(m, 'MMM', { locale: localeId }),
          fullLabel:    format(m, 'MMMM yyyy', { locale: localeId }),
          income:       paidInvs.reduce((s, inv) => s + inv.amount, 0),
          paidCount:    paidInvs.length,
          unpaidCount:  unpaidInvs.length,
          unpaidAmount: unpaidInvs.reduce((s, inv) => s + inv.amount, 0),
        }
      })

      setMonths(parsed)
      setLoading(false)
    }
    load()
  }, [])

  // ── Derived ──
  const now          = new Date()
  const monthLabel   = format(now, 'MMMM yyyy', { locale: localeId })
  const current      = months[months.length - 1]
  const previous     = months[months.length - 2]
  const paidDiff     = current && previous ? current.paidCount - previous.paidCount : 0
  const paidPct      = current && (current.paidCount + current.unpaidCount) > 0
    ? Math.round(current.paidCount / (current.paidCount + current.unpaidCount) * 100)
    : 0
  const totalCurrent = current ? current.income + current.unpaidAmount : 0
  const incomePct    = totalCurrent > 0 ? (current?.income ?? 0) / totalCurrent * 100 : 0
  const unpaidPct    = totalCurrent > 0 ? (current?.unpaidAmount ?? 0) / totalCurrent * 100 : 0

  return (
    <div className="min-h-screen pb-28 md:pb-8">

      {/* ── Green Header ──────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-6">
        <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-1">
          Laporan · {monthLabel}
        </p>

        {loading ? (
          <div className="space-y-2 mb-4">
            <div className="h-9 w-48 bg-white/10 rounded-xl animate-pulse" />
            <div className="h-3.5 w-56 bg-white/10 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="mb-4">
            <p className="font-display font-black text-white text-3xl md:text-4xl tracking-tight leading-none">
              {formatRpFull(current?.income ?? 0)}
            </p>
            <p className="text-green-300 text-xs font-medium mt-1.5">
              Pemasukan bulan ini · {current?.paidCount ?? 0}/{(current?.paidCount ?? 0) + (current?.unpaidCount ?? 0)} tagihan lunas
            </p>
          </div>
        )}

        {/* Stat strip */}
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-10 rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Kamar Terisi', value: rooms.occupied, dot: 'bg-green-400' },
              { label: 'Kamar Kosong', value: rooms.empty,    dot: 'bg-red-400'   },
              { label: 'Tingkat Lunas', value: `${paidPct}%`, dot: 'bg-amber'     },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/15 rounded-xl px-2.5 py-2 flex items-center gap-2">
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

      <div className="px-4 md:px-8 py-4 space-y-4">

        {/* ── Metric Cards 2×2 ──────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-2.5 w-12 rounded" />
                <Skeleton className="h-2 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              value={current?.paidCount ?? 0}
              label="Lunas"
              sub={
                paidDiff === 0 ? 'Sama seperti bln lalu' :
                paidDiff > 0
                  ? <span className="flex items-center gap-1 text-green-700"><TrendingUp size={11} /> +{paidDiff} dari bln lalu</span>
                  : <span className="flex items-center gap-1 text-red-600"><TrendingDown size={11} /> {paidDiff} dari bln lalu</span>
              }
              subColor={paidDiff >= 0 ? 'text-green-700' : 'text-red-600'}
              index={0}
            />
            <MetricCard
              value={current?.unpaidCount ?? 0}
              label="Belum Lunas"
              sub={current?.unpaidAmount ? formatRp(current.unpaidAmount) : 'Semua lunas 🎉'}
              subColor="text-red-500"
              index={1}
            />
            <MetricCard
              value={`${paidPct}%`}
              label="Tingkat Lunas"
              sub={paidPct >= 80 ? '✓ Di atas target 80%' : `Target 80% (kurang ${80 - paidPct}%)`}
              subColor={paidPct >= 80 ? 'text-green-700' : 'text-amber-600'}
              index={2}
            />
            <MetricCard
              value={rooms.empty}
              label="Kamar Kosong"
              sub={rooms.empty === 0 ? 'Semua kamar terisi 🎉' : `dari ${rooms.total} total kamar`}
              subColor={rooms.empty === 0 ? 'text-green-700' : 'text-gray-400'}
              index={3}
            />
          </div>
        )}

        {/* ── Bar Chart ──────────────────────────────────────── */}
        <BarChart months={months} loading={loading} />

        {/* ── Rincian ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <p className="font-display font-bold text-sm text-gray-900 tracking-tight">
            Rincian Tagihan Bulan Ini
          </p>
          {loading ? (
            <div className="space-y-4">
              {[0, 1].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <ProgressRow
                label="Sudah Lunas"
                amount={current?.income ?? 0}
                pct={incomePct}
                color="bg-green-700"
                index={0}
              />
              <ProgressRow
                label="Belum Lunas"
                amount={current?.unpaidAmount ?? 0}
                pct={unpaidPct}
                color="bg-red-400"
                index={1}
              />
            </div>
          )}
        </div>

        {/* ── Export Buttons ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: '220ms' }}>
          {[
            { icon: FileText, label: 'PDF',      color: 'text-red-600',   bg: 'bg-red-50   border-red-100'   },
            { icon: Table2,   label: 'Excel',    color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
            { icon: Share2,   label: 'Kirim WA', color: 'text-blue-600',  bg: 'bg-blue-50  border-blue-100'  },
          ].map(({ icon: Icon, label, color, bg }) => (
            <button
              key={label}
              className={cn(
                'flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border',
                'active:scale-[0.96] transition-all duration-100 font-bold text-xs',
                bg, color
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* ── 6-Month History Table ───────────────────────────── */}
        {!loading && months.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '260ms' }}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-display font-bold text-sm text-gray-900 tracking-tight">Histori 6 Bulan</p>
            </div>
            <div className="divide-y divide-gray-100">
              {months.slice().reverse().map((m, i) => (
                <div key={m.shortLabel} className="flex items-center px-4 py-3 gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-green-700 uppercase">{m.shortLabel}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 capitalize">{m.fullLabel}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {m.paidCount} lunas · {m.unpaidCount} belum
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-800">{formatRp(m.income)}</p>
                    {m.unpaidAmount > 0 && (
                      <p className="text-[11px] text-red-500 mt-0.5">-{formatRp(m.unpaidAmount)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
