'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BedDouble, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard',          label: 'Beranda', icon: LayoutDashboard },
  { href: '/dashboard/rooms',    label: 'Kamar',   icon: BedDouble },
  { href: '/dashboard/invoices', label: 'Tagihan', icon: FileText },
  { href: '/dashboard/tenants',  label: 'Penyewa', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 pb-safe">
      <div className="flex w-full">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors duration-150',
                active ? 'text-green-800' : 'text-gray-400'
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {active && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-800" />
                )}
              </div>
              <span className={cn('text-[10px] font-bold', active ? 'text-green-800' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
