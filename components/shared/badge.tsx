import { cn } from "@/lib/utils";

type BadgeVariant = "lunas" | "belum" | "hampir" | "kosong" | "aktif" | "maintenance";

const variantClass: Record<BadgeVariant, string> = {
  lunas:       "bg-green-100 text-green-800",
  aktif:       "bg-green-100 text-green-800",
  belum:       "bg-red-100 text-red-600",
  kosong:      "bg-red-100 text-red-600",
  hampir:      "bg-amber-light text-amber-700",
  maintenance: "bg-yellow-100 text-yellow-700",
};

const variantLabel: Record<BadgeVariant, string> = {
  lunas:       "Lunas ✓",
  aktif:       "Aktif",
  belum:       "Belum",
  kosong:      "Kosong",
  hampir:      "Hampir J.T.",
  maintenance: "Perbaikan",
};

export function Badge({
  variant,
  label,
  className,
}: {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
        variantClass[variant],
        className
      )}
    >
      {label ?? variantLabel[variant]}
    </span>
  );
}
