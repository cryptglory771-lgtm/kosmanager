import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-lg", className)} />
  );
}

export function InvoiceRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 last:border-0">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2 items-end flex flex-col">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function RoomTileSkeleton() {
  return (
    <div className="aspect-square rounded-xl animate-pulse bg-gray-200" />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 bg-white/10 space-y-2 animate-pulse">
      <Skeleton className="h-7 w-16 bg-white/20" />
      <Skeleton className="h-3 w-24 bg-white/20" />
    </div>
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <InvoiceRowSkeleton key={i} />
      ))}
    </div>
  );
}
