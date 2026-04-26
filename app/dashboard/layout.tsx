import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PropertyProvider } from '@/lib/property-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PropertyProvider>
      <div className="min-h-screen bg-cream">
        <Sidebar />
        <main className="md:pl-60 pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </PropertyProvider>
  )
}
