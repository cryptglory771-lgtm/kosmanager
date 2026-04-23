'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, BedDouble, Users, FileText, BarChart2, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/rooms', label: 'Kamar', icon: BedDouble },
  { href: '/dashboard/tenants/new', label: 'Tambah Penyewa', icon: Users },
  { href: '/dashboard/invoices', label: 'Tagihan', icon: FileText },
  { href: '/dashboard/reports', label: 'Laporan', icon: BarChart2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <span className="font-bold text-lg">🏠 KosManager</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 w-full transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
