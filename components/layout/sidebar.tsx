'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BedDouble, Users, FileText,
  BarChart2, LogOut, Building2, ChevronDown, Check,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProperty } from '@/lib/property-context'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',              label: 'Beranda',    icon: LayoutDashboard },
  { href: '/dashboard/rooms',        label: 'Kamar',      icon: BedDouble },
  { href: '/dashboard/tenants',      label: 'Penyewa',    icon: Users },
  { href: '/dashboard/invoices',     label: 'Tagihan',    icon: FileText },
  { href: '/dashboard/reports',      label: 'Laporan',    icon: BarChart2 },
  { href: '/dashboard/properties',   label: 'Properti',   icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { properties, selected, selectedId, setSelectedId } = useProperty()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 bg-green-900 fixed inset-y-0 left-0 z-40">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center font-display font-black text-green-900 text-sm">
          K
        </div>
        <span className="font-display font-bold text-white text-base tracking-tight">
          Kos<span className="text-green-400">Manager</span>
        </span>
      </Link>

      {/* Property Switcher */}
      {properties.length > 0 && (
        <div className="px-3 pt-3 pb-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 px-2 mb-1">
            Properti Aktif
          </p>
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(v => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-left"
            >
              <Building2 size={13} className="text-green-400 shrink-0" />
              <span className="flex-1 text-xs font-bold text-white truncate">
                {selected?.name ?? 'Pilih Properti'}
              </span>
              <ChevronDown
                size={12}
                className={cn('text-white/40 transition-transform duration-200 shrink-0', switcherOpen && 'rotate-180')}
              />
            </button>

            {switcherOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-green-800 rounded-xl border border-white/10 shadow-xl overflow-hidden z-20">
                  {properties.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedId(p.id); setSwitcherOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                    >
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        p.id === selectedId ? 'bg-green-400' : 'bg-white/20'
                      )} />
                      <span className="flex-1 text-xs font-medium text-white truncate">{p.name}</span>
                      {p.id === selectedId && <Check size={11} className="text-green-400 shrink-0" />}
                    </button>
                  ))}
                  <Link
                    href="/dashboard/properties"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-green-400">+ Kelola Properti</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-green-800 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 w-full transition-all duration-150"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
