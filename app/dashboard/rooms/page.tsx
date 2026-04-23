'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

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

const TIPE_KAMAR_OPTIONS = ['Standar', 'Premier', 'Deluxe', 'Suite', 'VIP']

const statusLabel: Record<string, string> = {
  occupied: 'Terisi', empty: 'Kosong', maintenance: 'Perbaikan',
}
const statusColor: Record<string, string> = {
  occupied: 'bg-green-100 text-green-700',
  empty: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
}
const tipeColor: Record<string, string> = {
  Standar: 'bg-blue-50 text-blue-600',
  Premier: 'bg-purple-50 text-purple-600',
  Deluxe: 'bg-amber-50 text-amber-600',
  Suite: 'bg-rose-50 text-rose-600',
  VIP: 'bg-emerald-50 text-emerald-700',
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ price: string; tipe_kamar: string; fasilitas: FasilitasKamar }>({
    price: '', tipe_kamar: 'Standar', fasilitas: { ...DEFAULT_FASILITAS },
  })
  const [showAdd, setShowAdd] = useState(false)
  const [newRoom, setNewRoom] = useState({
    room_number: '', monthly_price: '',
    tipe_kamar: 'Standar', fasilitas: { ...DEFAULT_FASILITAS },
  })
  const [loading, setLoading] = useState(false)

  async function load() {
    const { data } = await supabase.from('rooms').select('*').order('room_number')
    setRooms((data ?? []).map(r => ({
      ...r,
      fasilitas: r.fasilitas ?? DEFAULT_FASILITAS,
      tipe_kamar: r.tipe_kamar ?? 'Standar',
    })))
  }

  useEffect(() => { load() }, [])

  async function addRoom() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prop } = await supabase.from('properties').select('id').eq('owner_id', user?.id).single()
    await supabase.from('rooms').insert({
      property_id: prop?.id,
      room_number: newRoom.room_number,
      monthly_price: parseInt(newRoom.monthly_price),
      tipe_kamar: newRoom.tipe_kamar,
      fasilitas: newRoom.fasilitas,
    })
    setNewRoom({ room_number: '', monthly_price: '', tipe_kamar: 'Standar', fasilitas: { ...DEFAULT_FASILITAS } })
    setShowAdd(false)
    setLoading(false)
    load()
  }

  function startEdit(room: Room) {
    setEditingId(room.id)
    setEditData({ price: String(room.monthly_price), tipe_kamar: room.tipe_kamar, fasilitas: { ...room.fasilitas } })
  }

  async function saveEdit(id: string) {
    await supabase.from('rooms').update({
      monthly_price: parseInt(editData.price),
      tipe_kamar: editData.tipe_kamar,
      fasilitas: editData.fasilitas,
    }).eq('id', id)
    setEditingId(null)
    load()
  }

  function toggleEditFasilitas(key: keyof FasilitasKamar) {
    setEditData(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  function toggleNewFasilitas(key: keyof FasilitasKamar) {
    setNewRoom(p => ({ ...p, fasilitas: { ...p.fasilitas, [key]: !p.fasilitas[key] } }))
  }

  function activeFasilitas(f: FasilitasKamar) {
    return (Object.keys(f) as (keyof FasilitasKamar)[]).filter(k => f[k])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Kamar</h1>
        <Button onClick={() => setShowAdd(v => !v)} size="sm">
          <Plus size={14} className="mr-1" /> Tambah Kamar
        </Button>
      </div>

      {/* Form Tambah Kamar */}
      {showAdd && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Kamar Baru</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nomor Kamar</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A1"
                value={newRoom.room_number}
                onChange={e => setNewRoom(p => ({ ...p, room_number: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Harga Sewa/Bulan (Rp)</label>
              <input
                className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1500000"
                value={newRoom.monthly_price}
                onChange={e => setNewRoom(p => ({ ...p, monthly_price: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipe Kamar</label>
            <select
              className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newRoom.tipe_kamar}
              onChange={e => setNewRoom(p => ({ ...p, tipe_kamar: e.target.value }))}
            >
              {TIPE_KAMAR_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Fasilitas</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(DEFAULT_FASILITAS) as (keyof FasilitasKamar)[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleNewFasilitas(key)}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                    newRoom.fasilitas[key]
                      ? 'bg-green-50 border-green-400 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {FASILITAS_ICON[key]} {newRoom.fasilitas[key] ? '✓ ' : ''}{LABEL_FASILITAS[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={addRoom} disabled={loading || !newRoom.room_number || !newRoom.monthly_price} size="sm">
              Simpan
            </Button>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>
      )}

      {/* Daftar Kamar */}
      <div className="bg-white rounded-xl border divide-y">
        {rooms.length === 0 && (
          <p className="p-4 text-sm text-gray-400">Belum ada kamar. Tambahkan kamar pertama kamu.</p>
        )}
        {rooms.map(room => (
          <div key={room.id}>
            {/* Row utama */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-gray-800 w-10 shrink-0">{room.room_number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor[room.status] ?? statusColor.empty}`}>
                  {statusLabel[room.status] ?? room.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${tipeColor[room.tipe_kamar] ?? 'bg-gray-100 text-gray-600'}`}>
                  {room.tipe_kamar}
                </span>
                {/* Ikon fasilitas aktif */}
                <span className="text-sm hidden sm:block truncate">
                  {activeFasilitas(room.fasilitas).map(k => FASILITAS_ICON[k]).join(' ')}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingId === room.id ? (
                  <>
                    <button onClick={() => saveEdit(room.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">Rp {room.monthly_price.toLocaleString('id-ID')}</span>
                    <button
                      onClick={() => startEdit(room)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === room.id ? null : room.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedId === room.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Edit panel */}
            {editingId === room.id && (
              <div className="px-4 pb-4 space-y-3 bg-gray-50 border-t">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Harga Sewa/Bulan (Rp)</label>
                    <input
                      className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editData.price}
                      onChange={e => setEditData(p => ({ ...p, price: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tipe Kamar</label>
                    <select
                      className="border rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editData.tipe_kamar}
                      onChange={e => setEditData(p => ({ ...p, tipe_kamar: e.target.value }))}
                    >
                      {TIPE_KAMAR_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Fasilitas</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(DEFAULT_FASILITAS) as (keyof FasilitasKamar)[]).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleEditFasilitas(key)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                          editData.fasilitas[key]
                            ? 'bg-green-50 border-green-400 text-green-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {FASILITAS_ICON[key]} {editData.fasilitas[key] ? '✓ ' : ''}{LABEL_FASILITAS[key]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expand detail fasilitas */}
            {expandedId === room.id && editingId !== room.id && (
              <div className="px-4 pb-3 border-t bg-gray-50">
                <div className="pt-3 flex flex-wrap gap-2">
                  {activeFasilitas(room.fasilitas).length === 0 ? (
                    <span className="text-xs text-gray-400">Tidak ada fasilitas tercatat.</span>
                  ) : activeFasilitas(room.fasilitas).map(k => (
                    <span key={k} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5">
                      {FASILITAS_ICON[k]} {LABEL_FASILITAS[k]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
