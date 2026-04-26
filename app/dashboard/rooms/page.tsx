'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, X, Check, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type FasilitasKamar = {
  ac: boolean; kamar_mandi_dalam: boolean; kulkas: boolean
  tv: boolean; meja_belajar: boolean; lemari: boolean
  kasur: boolean; jendela: boolean; balkon: boolean
}

type Room = {
  id: string
  room_number: string
  monthly_price: number
  status: string
  tipe_kamar: string
  fasilitas: FasilitasKamar
}

type FormData = {
  room_number: string
  monthly_price: string
  tipe_kamar: string
  fasilitas: FasilitasKamar
}

// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_FASILITAS: FasilitasKamar = {
  ac: false, kamar_mandi_dalam: false, kulkas: false,
  tv: false, meja_belajar: false, lemari: false,
  kasur: false, jendela: false, balkon: false,
}

const LABEL_FASILITAS: Record<keyof FasilitasKamar, string> = {
  ac: 'AC', kamar_mandi_dalam: 'KM Dalam', kulkas: 'Kulkas',
  tv: 'TV', meja_belajar: 'Meja Belajar', lemari: 'Lemari',
  kasur: 'Kasur', jendela: 'Jendela', balkon: 'Balkon',
}

const FASILITAS_ICON: Record<keyof FasilitasKamar, string> = {
  ac: '❄️', kamar_mandi_dalam: '🚿', kulkas: '🧊',
  tv: '📺', meja_belajar: '📚', lemari: '🗄️',
  kasur: '🛏️', jendela: '🪟', balkon: '🏠',
}

const TIPE_OPTIONS = ['Standar', 'Premier', 'Deluxe', 'Suite', 'VIP']

const STATUS_CYCLE: Record<string, string> = {
  empty: 'occupied', occupied: 'maintenance', maintenance: 'empty',
}

const STATUS_LABEL: Record<string, string> = {
  occupied: 'Terisi', empty: 'Kosong', maintenance: 'Perbaikan',
}

const STATUS_STYLE: Record<string, string> = {
  occupied:    'bg-green-100 text-green-700 border-green-200',
  empty:       'bg-red-50 text-red-600 border-red-200',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
}

const TIPE_STYLE: Record<string, string> = {
  Standar: 'bg-blue-50 text-blue-600',
  Premier: 'bg-purple-50 text-purple-600',
  Deluxe:  'bg-amber-50 text-amber-600',
  Suite:   'bg-rose-50 text-rose-600',
  VIP:     'bg-emerald-50 text-emerald-700',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function activeFasilitas(f: FasilitasKamar) {
  return (Object.keys(f) as (keyof FasilitasKamar)[]).filter(k => f[k])
}

function emptyForm(): FormData {
  return { room_number: '', monthly_price: '', tipe_kamar: 'Standar', fasilitas: { ...DEFAULT_FASILITAS } }
}

// ── Room Card ──────────────────────────────────────────────────────────────
function RoomCard({
  room, index, onEdit, onStatusChange,
}: {
  room: Room
  index: number
  onEdit: (r: Room) => void
  onStatusChange: (r: Room) => void
}) {
  const active = activeFasilitas(room.fasilitas)

  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-up flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Status accent bar */}
      <div className={cn('h-1 w-full shrink-0', {
        'bg-green-500': room.status === 'occupied',
        'bg-red-400':   room.status === 'empty',
        'bg-amber-400': room.status === 'maintenance',
      })} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header: room number + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display font-black text-2xl text-gray-900 leading-none tracking-tight">
              {room.room_number}
            </p>
            <span className={cn(
              'inline-block text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full',
              TIPE_STYLE[room.tipe_kamar] ?? 'bg-gray-100 text-gray-600'
            )}>
              {room.tipe_kamar}
            </span>
          </div>

          <button
            onClick={() => onStatusChange(room)}
            title="Klik untuk ganti status"
            className={cn(
              'flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border',
              'active:scale-95 transition-all duration-100 shrink-0',
              STATUS_STYLE[room.status] ?? STATUS_STYLE.empty
            )}
          >
            {STATUS_LABEL[room.status] ?? room.status}
            <RotateCcw size={9} className="opacity-50" />
          </button>
        </div>

        {/* Price */}
        <p className="text-sm font-bold text-green-800 leading-none">
          {formatRp(room.monthly_price)}
          <span className="text-gray-400 font-medium text-xs">/bln</span>
        </p>

        {/* Fasilitas icons */}
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {active.length === 0 ? (
            <span className="text-[11px] text-gray-300 italic">—</span>
          ) : active.map(k => (
            <span key={k} className="text-sm" title={LABEL_FASILITAS[k]}>
              {FASILITAS_ICON[k]}
            </span>
          ))}
        </div>

        {/* Edit button */}
        <button
          onClick={() => onEdit(room)}
          className="mt-auto flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-green-700 transition-colors active:scale-95"
        >
          <Pencil size={11} /> Edit
        </button>
      </div>
    </div>
  )
}

// ── Room Sheet ─────────────────────────────────────────────────────────────
function RoomSheet({
  mode, form, onChange, onToggleFasilitas, onSave, onClose, saving,
}: {
  mode: 'add' | 'edit'
  form: FormData
  onChange: (patch: Partial<FormData>) => void
  onToggleFasilitas: (key: keyof FasilitasKamar) => void
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const canSave = form.room_number.trim() !== '' && form.monthly_price.trim() !== ''

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-safe md:pb-6">
          <div className="flex items-center justify-between py-3 mb-4 border-b border-gray-100">
            <p className="font-display font-bold text-base text-gray-900">
              {mode === 'add' ? 'Tambah Kamar' : 'Edit Kamar'}
            </p>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Nomor Kamar
                </label>
                <input
                  className={cn(
                    'w-full border-2 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none transition-colors',
                    mode === 'edit'
                      ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 focus:border-green-600'
                  )}
                  placeholder="A1"
                  value={form.room_number}
                  readOnly={mode === 'edit'}
                  onChange={e => onChange({ room_number: e.target.value })}
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Harga/Bulan (Rp)
                </label>
                <input
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-green-600 transition-colors"
                  placeholder="1500000"
                  inputMode="numeric"
                  value={form.monthly_price}
                  onChange={e => onChange({ monthly_price: e.target.value.replace(/\D/g, '') })}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Tipe Kamar
              </label>
              <div className="flex gap-2 flex-wrap">
                {TIPE_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChange({ tipe_kamar: t })}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all active:scale-95',
                      form.tipe_kamar === t
                        ? 'bg-green-800 text-white border-green-800'
                        : 'bg-white text-gray-500 border-gray-200'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Fasilitas
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(DEFAULT_FASILITAS) as (keyof FasilitasKamar)[]).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleFasilitas(key)}
                    className={cn(
                      'py-2 px-2.5 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 text-left',
                      form.fasilitas[key]
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : 'border-gray-200 text-gray-500'
                    )}
                  >
                    {FASILITAS_ICON[key]} {LABEL_FASILITAS[key]}
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
            {saving ? 'Menyimpan...' : 'Simpan Kamar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function RoomsPage() {
  const { selectedId, selected } = useProperty()
  const [rooms,     setRooms]     = useState<Room[]>([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [showSheet, setShowSheet] = useState(false)
  const [sheetMode, setSheetMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<FormData>(emptyForm())

  async function loadRooms() {
    if (!selectedId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', selectedId)
      .order('room_number')
    setRooms((data ?? []).map(r => ({
      ...r,
      fasilitas:  r.fasilitas  ?? DEFAULT_FASILITAS,
      tipe_kamar: r.tipe_kamar ?? 'Standar',
    })))
    setLoading(false)
  }

  useEffect(() => { loadRooms() }, [selectedId])

  function openAdd() {
    setForm(emptyForm())
    setEditingId(null)
    setSheetMode('add')
    setShowSheet(true)
  }

  function openEdit(room: Room) {
    setForm({
      room_number:   room.room_number,
      monthly_price: String(room.monthly_price),
      tipe_kamar:    room.tipe_kamar,
      fasilitas:     { ...room.fasilitas },
    })
    setEditingId(room.id)
    setSheetMode('edit')
    setShowSheet(true)
  }

  function closeSheet() {
    setShowSheet(false)
    setEditingId(null)
  }

  function patchForm(patch: Partial<FormData>) {
    setForm(p => ({ ...p, ...patch }))
  }

  function toggleFasilitas(key: keyof FasilitasKamar) {
    setForm(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  async function saveRoom() {
    setSaving(true)
    if (sheetMode === 'add') {
      await supabase.from('rooms').insert({
        property_id:   selectedId,
        room_number:   form.room_number.trim(),
        monthly_price: parseInt(form.monthly_price),
        tipe_kamar:    form.tipe_kamar,
        fasilitas:     form.fasilitas,
        status:        'empty',
      })
    } else if (editingId) {
      await supabase.from('rooms').update({
        monthly_price: parseInt(form.monthly_price),
        tipe_kamar:    form.tipe_kamar,
        fasilitas:     form.fasilitas,
      }).eq('id', editingId)
    }
    setSaving(false)
    closeSheet()
    loadRooms()
  }

  async function cycleStatus(room: Room) {
    const next = STATUS_CYCLE[room.status] ?? 'empty'
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: next } : r))
    await supabase.from('rooms').update({ status: next }).eq('id', room.id)
  }

  const total    = rooms.length
  const occupied = rooms.filter(r => r.status === 'occupied').length
  const empty    = rooms.filter(r => r.status === 'empty').length

  return (
    <div className="min-h-screen pb-28 md:pb-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-green-800 px-4 md:px-8 pt-5 md:pt-8 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-300 text-xs font-bold uppercase tracking-widest mb-0.5">
              {selected?.name ?? 'Kelola'}
            </p>
            <h1 className="font-display font-black text-white text-2xl md:text-3xl tracking-tight">Kamar</h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-green-400 text-green-900 text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-transform mt-1"
          >
            <Plus size={14} strokeWidth={3} /> Tambah
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map(i => <div key={i} className="h-10 rounded-xl bg-white/10 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total',  value: total,    dot: 'bg-white/40'  },
              { label: 'Terisi', value: occupied, dot: 'bg-green-400' },
              { label: 'Kosong', value: empty,    dot: 'bg-red-400'   },
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

      {/* ── Grid ────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-7 w-12 rounded-lg" />
                  <Skeleton className="h-3 w-14 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map(j => <Skeleton key={j} className="w-5 h-5 rounded" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-14 flex flex-col items-center gap-3">
            <p className="text-3xl">🏠</p>
            <p className="text-sm font-bold text-gray-500">Belum ada kamar</p>
            <button
              onClick={openAdd}
              className="text-xs font-bold text-green-700 underline underline-offset-2"
            >
              Tambah kamar pertama →
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rooms.map((room, i) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  index={i}
                  onEdit={openEdit}
                  onStatusChange={cycleStatus}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-5 mt-4">
              {[
                { color: 'bg-green-500', label: 'Terisi' },
                { color: 'bg-red-400',   label: 'Kosong' },
                { color: 'bg-amber-400', label: 'Perbaikan' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={cn('w-2 h-2 rounded-full', l.color)} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{l.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Sheet ───────────────────────────────────────────── */}
      {showSheet && (
        <RoomSheet
          mode={sheetMode}
          form={form}
          onChange={patchForm}
          onToggleFasilitas={toggleFasilitas}
          onSave={saveRoom}
          onClose={closeSheet}
          saving={saving}
        />
      )}
    </div>
  )
}
