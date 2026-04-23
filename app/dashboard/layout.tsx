import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />

      {/* Konten utama — geser ke kanan sejauh lebar sidebar di md+ */}
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
