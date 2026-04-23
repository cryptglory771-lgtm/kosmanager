'use client'

import { useEffect, useState } from 'react'
import { BedDouble, Users, Wallet, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Stats = { totalRooms: number; occupiedRooms: number; monthlyIncome: number }
type Room = { id: string; room_number: string; status: string; monthly_price: number }
type Invoice = { id: string; amount: number; due_date: string; status: string; tenants: { name: string } | null }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalRooms: 0, occupiedRooms: 0, monthlyIncome: 0 })
  const [rooms, setRooms] = useState<Room[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    async function load() {
      const [{ data: roomsData }, { data: invoicesData }] = await Promise.all([
        supabase.from('rooms').select('id, room_number, status, monthly_price').order('room_number'),
        supabase.from('invoices').select('id, amount, due_date, status, tenants(name)').order('due_date').limit(5),
      ])

      const r = roomsData ?? []
      const occupied = r.filter(x => x.status === 'occupied')
      const income = occupied.reduce((sum, x) => sum + x.monthly_price, 0)

      setRooms(r)
      setInvoices((invoicesData ?? []) as unknown as Invoice[])
      setStats({ totalRooms: r.length, occupiedRooms: occupied.length, monthlyIncome: income })
    }
    load()
  }, [])

  const statusColor: Record<string, string> = {
    occupied: 'bg-green-100 border-green-300 text-green-800',
    empty: 'bg-gray-100 border-gray-300 text-gray-500',
    maintenance: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Beranda</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<BedDouble size={20} />} label="Total Kamar" value={stats.totalRooms} color="blue" />
        <StatCard icon={<Users size={20} />} label="Kamar Terisi" value={stats.occupiedRooms} color="green" />
        <StatCard icon={<Wallet size={20} />} label="Pemasukan Bulan Ini" value={`Rp ${stats.monthlyIncome.toLocaleString('id-ID')}`} color="purple" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status Kamar</h2>
        <div className="grid grid-cols-4 gap-2">
          {rooms.map(room => (
            <div key={room.id} className={`border rounded-lg p-3 text-center text-sm ${statusColor[room.status] ?? statusColor.empty}`}>
              <div className="font-semibold">{room.room_number}</div>
              <div className="text-xs capitalize mt-0.5">{room.status === 'occupied' ? 'Terisi' : room.status === 'maintenance' ? 'Perbaikan' : 'Kosong'}</div>
            </div>
          ))}
          {rooms.length === 0 && <p className="col-span-4 text-sm text-gray-400">Belum ada kamar.</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Tagihan Terbaru</h2>
        <div className="bg-white rounded-xl border divide-y">
          {invoices.length === 0 && <p className="p-4 text-sm text-gray-400">Belum ada tagihan.</p>}
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{inv.tenants?.name ?? '—'}</p>
                <p className="text-xs text-gray-400">Jatuh tempo: {inv.due_date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">Rp {inv.amount.toLocaleString('id-ID')}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {inv.status === 'paid' ? 'Lunas' : 'Belum'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
