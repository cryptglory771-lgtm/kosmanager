'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Send, AlertTriangle, User, ChevronDown, Check, LogOut, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
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

// ── Property Selector Sheet (mobile) ──────────────────────────────────────
function PropertySelectorSheet({
  onClose,
}: {
  onClose: () => void
}) {
  const { properties, selectedId, setSelectedId } = useProperty()

  function pick(id: string) {
    setSelectedId(id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end md:hidden"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl shadow-xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-5 pt-2 pb-safe">
          <div className="flex items-center justify-between py-3 mb-2 border-b border-gray-100">
            <p className="font-display font-bold text-base text-gray-900">Pilih Properti</p>
            <Link
              href="/dashboard/properties"
              onClick={onClose}
              className="text-xs font-bold text-green-700 underline underline-offset-2"
            >
              Kelola
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                className="w-full flex items-center gap-3 py-3.5 text-left active:bg-gray-50 transition-colors"
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  p.id === selectedId ? 'bg-green-800' : 'bg-gray-100'
                )}>
                  <Building2 size={16} className={p.id === selectedId ? 'text-white' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-bold truncate',
                    p.id === selectedId ? 'text-green-800' : 'text-gray-900'
                  )}>
                    {p.name}
                  </p>
                  {p.address && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{p.address}</p>
                  )}
                </div>
                {p.id === selectedId && <Check size={15} className="text-green-700 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Profile Sheet ──────────────────────────────────────────────────────────
function ProfileSheet({ name, onClose }: { name: string; onClose: () => void }) {
  const router = useRouter()
  const [form,    setForm]    = useState({ name: name, phone: '', email: '' })
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .single()
      setForm({
        name:  profile?.name  ?? name,
        phone: profile?.phone ?? '',
        email: user.email     ?? '',
      })
      setLoadingProfile(false)
    }
    loadProfile()
  }, [name])

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        name:  form.name.trim(),
        phone: form.phone.trim(),
      }).eq('id', user.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ini = form.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end md:hidden"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-safe">
          {/* Header */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-4">
            <p className="font-display font-bold text-base text-gray-900">Profil Saya</p>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            >
              <span className="text-gray-500 text-sm font-bold leading-none">✕</span>
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-green-700 flex items-center justify-center mb-2">
              <span className="font-display font-black text-white text-2xl leading-none">{ini}</span>
            </div>
            {!loadingProfile && (
              <p className="text-sm font-bold text-gray-900">{form.name || '—'}</p>
            )}
            {form.email && (
              <p className="text-xs text-gray-400 mt-0.5">{form.email}</p>
            )}
          </div>

          {/* Form fields */}
          {loadingProfile ? (
            <div className="space-y-4 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-11 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-green-600 transition-colors"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Nama lengkap"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-green-600 transition-colors"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  inputMode="tel"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                  value={form.email}
                  readOnly
                  style={{ fontSize: '16px' }}
                />
                <p className="text-[10px] text-gray-300 mt-1">Email tidak dapat diubah</p>
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={saveProfile}
            disabled={saving || loadingProfile}
            className={cn(
              'w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all mb-3',
              saved
                ? 'bg-green-600 text-white'
                : saving || loadingProfile
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-800 text-white active:scale-[0.98]'
            )}
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : saved
                ? <Check size={15} />
                : null
            }
            {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Perubahan'}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-red-100 text-red-600 bg-red-50 active:scale-[0.98] transition-all mb-2"
          >
            <LogOut size={15} />
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [profileName,      setProfileName]      = useState('')
  const [rooms,            setRooms]            = useState<Room[]>([])
  const [invoices,         setInvoices]         = useState<Invoice[]>([])
  const [stats,            setStats]            = useState<Stats>({
    totalRooms: 0, occupiedRooms: 0, monthlyIncome: 0,
    unpaidCount: 0, unpaidDaysLeft: null,
  })
  const [profileOpen,      setProfileOpen]      = useState(false)
  const [propSelectorOpen, setPropSelectorOpen] = useState(false)
  const { selectedId, selected } = useProperty()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const roomQuery = supabase
        .from('rooms')
        .select('id, room_number, status, monthly_price')
        .order('room_number')
      if (selectedId) roomQuery.eq('property_id', selectedId)

      const invoiceQuery = supabase
        .from('invoices')
        .select('id, amount, due_date, status, tenants(name, rooms(room_number))')
        .order('due_date', { ascending: true })
        .limit(5)
      if (selectedId) invoiceQuery.eq('tenants.rooms.property_id', selectedId)

      const [{ data: profile }, { data: roomsData }, { data: invoicesData }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', user.id).single(),
        roomQuery,
        invoiceQuery,
      ])

      const r    = roomsData ?? []
      const invs = (invoicesData ?? []) as unknown as Invoice[]

      const occupied = r.filter(x => x.status === 'occupied')
      const income   = occupied.reduce((s, x) => s + x.monthly_price, 0)
      const unpaid   = invs.filter(i => i.status !== 'paid')
      const minDays  = unpaid.length
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
  }, [selectedId])

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
            {selected && (
              <button
                onClick={() => setPropSelectorOpen(true)}
                className="md:hidden flex items-center gap-1 text-green-400 text-xs font-bold mt-1 active:opacity-70 transition-opacity"
              >
                🏠 {selected.name}
                <ChevronDown size={12} className="text-green-400" />
              </button>
            )}
            {selected && (
              <p className="hidden md:flex items-center gap-1 text-green-400 text-xs font-bold mt-1">
                🏠 {selected.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setProfileOpen(true)}
              className="md:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
              aria-label="Profil"
            >
              <User size={18} className="text-white" />
            </button>
            <button
              className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
              aria-label="Notifikasi"
            >
              <Bell size={18} className="text-white" />
              {stats.unpaidCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber rounded-full" />
              )}
            </button>
          </div>
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

      {/* ── Sheets ────────────────────────────────────────────── */}
      {propSelectorOpen && (
        <PropertySelectorSheet onClose={() => setPropSelectorOpen(false)} />
      )}
      {profileOpen && (
        <ProfileSheet name={profileName} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  )
}
