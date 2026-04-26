'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
import { Avatar } from '@/components/shared/avatar'
import { Badge } from '@/components/shared/badge'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

type Tenant = {
  id: string
  name: string
  phone: string
  start_date: string
  end_date: string
  rooms: { room_number: string; monthly_price: number } | null
}

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

export default function TenantsPage() {
  const { selectedId, selected } = useProperty()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedId) { setLoading(false); return }
    setLoading(true)
    supabase
      .from('tenants')
      .select('id, name, phone, start_date, end_date, rooms!inner(room_number, monthly_price, property_id)')
      .eq('rooms.property_id', selectedId)
      .order('name')
      .then(({ data }) => {
        setTenants((data ?? []) as unknown as Tenant[])
        setLoading(false)
      })
  }, [selectedId])

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    (t.rooms?.room_number ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="min-h-screen pb-24 md:pb-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-0.5">
              {selected?.name ?? 'Kelola'}
            </p>
            <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">
              Penyewa
            </h1>
          </div>
          <Link
            href="/dashboard/tenants/new"
            className="flex items-center gap-1.5 bg-green-400 text-green-900 text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-transform"
          >
            <Plus size={14} strokeWidth={3} /> Tambah
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nama atau nomor kamar..."
            className="w-full bg-white/10 border border-white/15 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors font-body"
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-4">
        {loading ? (
          <CardSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 flex flex-col items-center gap-3">
            <p className="text-3xl">👥</p>
            <p className="text-sm font-bold text-gray-500">
              {query ? 'Penyewa tidak ditemukan' : 'Belum ada penyewa'}
            </p>
            {!query && (
              <Link
                href="/dashboard/tenants/new"
                className="text-xs font-bold text-green-700 underline underline-offset-2"
              >
                Tambah penyewa pertama →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {filtered.map((t, i) => {
              const days   = daysLeft(t.end_date)
              const isNear = days <= 30 && days >= 0
              const isOver = days < 0

              return (
                <Link
                  key={t.id}
                  href={`/dashboard/tenants/${t.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Avatar initials={initials(t.name)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{t.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                      Kamar {t.rooms?.room_number ?? '—'} · Rp {(t.rooms?.monthly_price ?? 0).toLocaleString('id-ID')}/bln
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant={isOver ? 'belum' : isNear ? 'hampir' : 'aktif'}
                      label={isOver ? 'Kontrak habis' : isNear ? `Sisa ${days}h` : 'Aktif'}
                    />
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && tenants.length > 0 && (
          <p className={cn('text-center text-xs text-gray-400 mt-3 font-medium')}>
            {filtered.length} dari {tenants.length} penyewa
          </p>
        )}
      </div>
    </div>
  )
}
