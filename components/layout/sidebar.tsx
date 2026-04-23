'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, BedDouble, Users, FileText,
  BarChart2, LogOut, Home,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',              label: 'Beranda',      icon: LayoutDashboard },
  { href: '/dashboard/rooms',        label: 'Kamar',        icon: BedDouble },
  { href: '/dashboard/tenants/new',  label: 'Tambah Penyewa', icon: Users },
  { href: '/dashboard/invoices',     label: 'Tagihan',      icon: FileText },
  { href: '/dashboard/reports',      label: 'Laporan',      icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

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

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
              <Icon size={16} className="flex-shrink-0" />
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
