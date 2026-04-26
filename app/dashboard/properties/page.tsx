'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, X, Pencil, Building2, MapPin, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProperty, Property } from '@/lib/property-context'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type PropertyStats = {
  propertyId: string
  totalRooms: number
  occupiedRooms: number
  monthlyIncome: number
}

type FasilitasProperty = {
  wifi: boolean; parkir_motor: boolean; parkir_mobil: boolean
  dapur_bersama: boolean; laundry: boolean; security_24jam: boolean
  cctv: boolean; musholla: boolean; kolam_renang: boolean
}

type FormData = {
  name: string
  address: string
  jenis_kos: 'putra' | 'putri' | 'campur'
  fasilitas: FasilitasProperty
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_FASILITAS: FasilitasProperty = {
  wifi: false, parkir_motor: false, parkir_mobil: false,
  dapur_bersama: false, laundry: false, security_24jam: false,
  cctv: false, musholla: false, kolam_renang: false,
}

const FASILITAS_LABEL: Record<keyof FasilitasProperty, string> = {
  wifi: 'WiFi', parkir_motor: 'Parkir Motor', parkir_mobil: 'Parkir Mobil',
  dapur_bersama: 'Dapur', laundry: 'Laundry', security_24jam: 'Security 24j',
  cctv: 'CCTV', musholla: 'Musholla', kolam_renang: 'Kolam Renang',
}

const FASILITAS_ICON: Record<keyof FasilitasProperty, string> = {
  wifi: '📶', parkir_motor: '🏍️', parkir_mobil: '🚗',
  dapur_bersama: '🍳', laundry: '👕', security_24jam: '💂',
  cctv: '📹', musholla: '🕌', kolam_renang: '🏊',
}

const JENIS_OPTIONS: { key: 'putra' | 'putri' | 'campur'; label: string; color: string }[] = [
  { key: 'putra',  label: '🧑 Putra',  color: 'bg-blue-50 text-blue-700 border-blue-200'  },
  { key: 'putri',  label: '👩 Putri',  color: 'bg-pink-50 text-pink-700 border-pink-200'  },
  { key: 'campur', label: '👥 Campur', color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.', ',')}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${n.toLocaleString('id-ID')}`
}

function activeFasilitas(f: FasilitasProperty) {
  return (Object.keys(f) as (keyof FasilitasProperty)[]).filter(k => f[k])
}

function emptyForm(): FormData {
  return { name: '', address: '', jenis_kos: 'campur', fasilitas: { ...DEFAULT_FASILITAS } }
}

// ── Property Card ──────────────────────────────────────────────────────────
function PropertyCard({
  property, stats, isSelected, onSelect, onEdit, index,
}: {
  property: Property
  stats: PropertyStats | undefined
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  index: number
}) {
  const jenis   = JENIS_OPTIONS.find(j => j.key === property.jenis_kos)
  const active  = activeFasilitas(property.fasilitas as FasilitasProperty)
  const pct     = stats && stats.totalRooms > 0
    ? Math.round(stats.occupiedRooms / stats.totalRooms * 100)
    : 0

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-2 shadow-sm overflow-hidden animate-fade-up transition-all',
        isSelected ? 'border-green-700 shadow-green-100' : 'border-gray-200'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Selected accent */}
      {isSelected && <div className="h-1 bg-green-700 w-full" />}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={14} className={isSelected ? 'text-green-700' : 'text-gray-400'} />
              <p className={cn(
                'font-display font-black text-base leading-tight tracking-tight truncate',
                isSelected ? 'text-green-800' : 'text-gray-900'
              )}>
                {property.name}
              </p>
            </div>
            {property.address && (
              <div className="flex items-start gap-1.5 mt-1">
                <MapPin size={10} className="text-gray-300 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gray-400 leading-tight line-clamp-1">
                  {property.address}
                </p>
              </div>
            )}
          </div>
          {jenis && (
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0',
              jenis.color
            )}>
              {jenis.label}
            </span>
          )}
        </div>

        {/* Stats */}
        {stats ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{stats.occupiedRooms}/{stats.totalRooms} kamar terisi</span>
              <span className="font-bold text-gray-900">{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs font-bold text-green-800">{formatRp(stats.monthlyIncome)}/bln</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        )}

        {/* Fasilitas */}
        {active.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {active.slice(0, 5).map(k => (
              <span key={k} className="text-xs" title={FASILITAS_LABEL[k]}>
                {FASILITAS_ICON[k]}
              </span>
            ))}
            {active.length > 5 && (
              <span className="text-[10px] text-gray-400 font-medium">+{active.length - 5}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onSelect}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95',
              isSelected
                ? 'bg-green-700 text-white'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            )}
          >
            {isSelected ? <><Check size={11} /> Dipilih</> : <><ChevronRight size={11} /> Pilih</>}
          </button>
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-green-700 hover:border-green-200 transition-all active:scale-95"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Property Sheet ─────────────────────────────────────────────────────────
function PropertySheet({
  mode, form, onChange, onToggleFasilitas, onSave, onClose, saving,
}: {
  mode: 'add' | 'edit'
  form: FormData
  onChange: (patch: Partial<FormData>) => void
  onToggleFasilitas: (key: keyof FasilitasProperty) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const canSave = form.name.trim() !== ''

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl shadow-xl max-h-[92vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-safe md:pb-6">
          <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
            <p className="font-display font-bold text-base text-gray-900">
              {mode === 'add' ? 'Tambah Properti' : 'Edit Properti'}
            </p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200">
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Nama Properti *
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-green-600 transition-colors"
                placeholder="Kos Melati Indah"
                value={form.name}
                onChange={e => onChange({ name: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Alamat
              </label>
              <textarea
                rows={2}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-green-600 transition-colors resize-none"
                placeholder="Jl. Merdeka No. 5, Jakarta"
                value={form.address}
                onChange={e => onChange({ address: e.target.value })}
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Jenis Kos */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Jenis Kos
              </label>
              <div className="flex gap-2">
                {JENIS_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ jenis_kos: key })}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all active:scale-95',
                      form.jenis_kos === key
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-gray-500 border-gray-200'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fasilitas */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Fasilitas Umum
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DEFAULT_FASILITAS) as (keyof FasilitasProperty)[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleFasilitas(key)}
                    className={cn(
                      'py-2 px-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 text-left',
                      form.fasilitas[key]
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'border-gray-200 text-gray-500'
                    )}
                  >
                    {FASILITAS_ICON[key]} {FASILITAS_LABEL[key]}
                    {form.fasilitas[key] && <span className="ml-1 text-green-600">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onSave}
            disabled={saving || !canSave}
            className={cn(
              'w-full mt-6 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
              saving || !canSave
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-800 text-white active:scale-[0.98]'
            )}
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <Check size={15} />
            }
            {saving ? 'Menyimpan...' : 'Simpan Properti'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const { properties, selectedId, setSelectedId, loading: ctxLoading, reload } = useProperty()

  const [stats,     setStats]     = useState<PropertyStats[]>([])
  const [showSheet, setShowSheet] = useState(false)
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<FormData>(emptyForm())
  const [saving,    setSaving]    = useState(false)

  // Load room stats per property
  useEffect(() => {
    if (properties.length === 0) return
    Promise.all(
      properties.map(p =>
        supabase
          .from('rooms')
          .select('id, status, monthly_price')
          .eq('property_id', p.id)
          .then(({ data }) => {
            const rooms    = data ?? []
            const occupied = rooms.filter(r => r.status === 'occupied')
            return {
              propertyId:     p.id,
              totalRooms:     rooms.length,
              occupiedRooms:  occupied.length,
              monthlyIncome:  occupied.reduce((s, r) => s + r.monthly_price, 0),
            } as PropertyStats
          })
      )
    ).then(setStats)
  }, [properties])

  function openAdd() {
    setForm(emptyForm())
    setEditingId(null)
    setSheetMode('add')
    setShowSheet(true)
  }

  function openEdit(p: Property) {
    setForm({
      name:      p.name,
      address:   p.address ?? '',
      jenis_kos: (p.jenis_kos as 'putra' | 'putri' | 'campur') ?? 'campur',
      fasilitas: { ...DEFAULT_FASILITAS, ...(p.fasilitas as FasilitasProperty) },
    })
    setEditingId(p.id)
    setSheetMode('edit')
    setShowSheet(true)
  }

  function closeSheet() {
    setShowSheet(false)
    setEditingId(null)
  }

  function patchForm(patch: Partial<FormData>) {
    setForm(prev => ({ ...prev, ...patch }))
  }

  function toggleFasilitas(key: keyof FasilitasProperty) {
    setForm(prev => ({ ...prev, fasilitas: { ...prev.fasilitas, [key]: !prev.fasilitas[key] } }))
  }

  async function saveProperty() {
    setSaving(true)
    const payload = {
      name:      form.name.trim(),
      address:   form.address.trim() || null,
      jenis_kos: form.jenis_kos,
      fasilitas: form.fasilitas,
    }

    if (sheetMode === 'add') {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('properties')
        .insert({ ...payload, owner_id: user?.id })
        .select('id')
        .single()
      if (data?.id) setSelectedId(data.id)
    } else if (editingId) {
      await supabase.from('properties').update(payload).eq('id', editingId)
    }

    setSaving(false)
    closeSheet()
    reload()
  }

  const totalRooms    = stats.reduce((s, st) => s + st.totalRooms, 0)
  const totalOccupied = stats.reduce((s, st) => s + st.occupiedRooms, 0)
  const totalIncome   = stats.reduce((s, st) => s + st.monthlyIncome, 0)

  return (
    <div className="min-h-screen pb-28 md:pb-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-0.5">Kelola</p>
            <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">Properti</h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-green-400 text-green-900 text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-transform mt-1"
          >
            <Plus size={14} strokeWidth={3} /> Tambah
          </button>
        </div>

        {ctxLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => <div key={i} className="h-10 rounded-xl bg-white/10 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Properti', value: properties.length, dot: 'bg-white/40' },
              { label: 'Kamar',    value: totalRooms,         dot: 'bg-green-400' },
              { label: 'Terisi',   value: totalOccupied,      dot: 'bg-amber' },
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

        {!ctxLoading && totalIncome > 0 && (
          <p className="text-green-300 text-xs font-medium mt-3">
            Total pemasukan: <span className="text-white font-bold">{formatRp(totalIncome)}/bln</span>
          </p>
        )}
      </div>

      {/* ── Cards ────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-4">
        {ctxLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 animate-pulse">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-8 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-14 flex flex-col items-center gap-3">
            <p className="text-4xl">🏠</p>
            <p className="text-sm font-bold text-gray-500">Belum ada properti</p>
            <p className="text-xs text-gray-400 text-center max-w-[200px]">
              Tambahkan properti pertama untuk mulai kelola kos Anda
            </p>
            <button
              onClick={openAdd}
              className="text-xs font-bold text-green-700 underline underline-offset-2"
            >
              Tambah properti pertama →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id}
                property={p}
                stats={stats.find(s => s.propertyId === p.id)}
                isSelected={p.id === selectedId}
                onSelect={() => setSelectedId(p.id)}
                onEdit={() => openEdit(p)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sheet ───────────────────────────────────────────── */}
      {showSheet && (
        <PropertySheet
          mode={sheetMode}
          form={form}
          onChange={patchForm}
          onToggleFasilitas={toggleFasilitas}
          onSave={saveProperty}
          onClose={closeSheet}
          saving={saving}
        />
      )}
    </div>
  )
}
