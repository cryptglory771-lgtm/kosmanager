'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

type Room = { id: string; room_number: string; monthly_price: number; status: string }

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newRoom, setNewRoom] = useState({ room_number: '', monthly_price: '' })
  const [loading, setLoading] = useState(false)

  async function load() {
    const { data } = await supabase.from('rooms').select('*').order('room_number')
    setRooms(data ?? [])
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
    })
    setNewRoom({ room_number: '', monthly_price: '' })
    setShowAdd(false)
    setLoading(false)
    load()
  }

  async function savePrice(id: string) {
    await supabase.from('rooms').update({ monthly_price: parseInt(editPrice) }).eq('id', id)
    setEditingId(null)
    load()
  }

  const statusLabel: Record<string, string> = {
    occupied: 'Terisi', empty: 'Kosong', maintenance: 'Perbaikan',
  }
  const statusColor: Record<string, string> = {
    occupied: 'bg-green-100 text-green-700',
    empty: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Kamar</h1>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus size={14} className="mr-1" /> Tambah Kamar
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white border rounded-xl p-4 flex gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nomor Kamar</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A1"
              value={newRoom.room_number}
              onChange={e => setNewRoom(p => ({ ...p, room_number: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Harga Sewa/Bulan (Rp)</label>
            <input
              className="border rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1500000"
              value={newRoom.monthly_price}
              onChange={e => setNewRoom(p => ({ ...p, monthly_price: e.target.value }))}
            />
          </div>
          <Button onClick={addRoom} disabled={loading || !newRoom.room_number || !newRoom.monthly_price} size="sm">
            Simpan
          </Button>
          <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border divide-y">
        {rooms.length === 0 && <p className="p-4 text-sm text-gray-400">Belum ada kamar. Tambahkan kamar pertama kamu.</p>}
        {rooms.map(room => (
          <div key={room.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-800 w-12">{room.room_number}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[room.status] ?? statusColor.empty}`}>
                {statusLabel[room.status] ?? room.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {editingId === room.id ? (
                <>
                  <input
                    className="border rounded px-2 py-1 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                  />
                  <button onClick={() => savePrice(room.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-700">Rp {room.monthly_price.toLocaleString('id-ID')}</span>
                  <button onClick={() => { setEditingId(room.id); setEditPrice(String(room.monthly_price)) }}
                    className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
