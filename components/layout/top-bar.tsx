'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  showBack?: boolean
  right?: React.ReactNode
  transparent?: boolean
  className?: string
}

export function TopBar({ title, showBack = false, right, transparent = false, className }: TopBarProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'flex md:hidden items-center gap-3 px-4 h-14 sticky top-0 z-30',
        transparent
          ? 'bg-transparent'
          : 'bg-white border-b border-gray-200',
        className
      )}
    >
      {showBack && (
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
      )}
      <h1 className="flex-1 font-display font-bold text-base text-gray-900 tracking-tight truncate">
        {title}
      </h1>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  )
}
