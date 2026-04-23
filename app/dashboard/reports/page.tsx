'use client'

import { useEffect, useState } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

type MonthStat = { month: string; income: number; paid: number; unpaid: number }

export default function ReportsPage() {
  const [stats, setStats] = useState<MonthStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i)).reverse()
      const results: MonthStat[] = []

      for (const m of months) {
        const start = format(startOfMonth(m), 'yyyy-MM-dd')
        const end = format(endOfMonth(m), 'yyyy-MM-dd')
        const { data } = await supabase.from('invoices').select('amount, status').gte('due_date', start).lte('due_date', end)
        const invoices = data ?? []
        const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
        const unpaid = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)
        results.push({ month: format(m, 'MMM yyyy', { locale: id }), income: paid, paid, unpaid })
      }
      setStats(results)
      setLoading(false)
    }
    load()
  }, [])

  const maxIncome = Math.max(...stats.map(s => s.income), 1)
  const totalIncome = stats.reduce((s, m) => s + m.income, 0)
  const currentMonth = stats[stats.length - 1]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Laporan Keuangan</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Pemasukan Bulan Ini</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            Rp {(currentMonth?.income ?? 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-xs text-gray-500">Total 6 Bulan Terakhir</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            Rp {totalIncome.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pemasukan 6 Bulan Terakhir</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Memuat...</p>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {stats.map(s => (
              <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {s.income > 0 ? `${(s.income / 1_000_000).toFixed(1)}jt` : ''}
                </span>
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all"
                  style={{ height: `${(s.income / maxIncome) * 100}%`, minHeight: s.income > 0 ? '4px' : '0' }}
                />
                <span className="text-xs text-gray-500">{s.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border divide-y">
        <div className="px-4 py-3 flex text-xs font-medium text-gray-500">
          <span className="flex-1">Bulan</span>
          <span className="w-32 text-right">Lunas</span>
          <span className="w-32 text-right">Belum Lunas</span>
        </div>
        {stats.slice().reverse().map(s => (
          <div key={s.month} className="px-4 py-3 flex text-sm">
            <span className="flex-1 text-gray-800 font-medium">{s.month}</span>
            <span className="w-32 text-right text-green-700">Rp {s.paid.toLocaleString('id-ID')}</span>
            <span className="w-32 text-right text-red-600">Rp {s.unpaid.toLocaleString('id-ID')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
