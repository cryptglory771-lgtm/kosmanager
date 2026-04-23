import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl flex-shrink-0 flex items-center justify-center font-bold bg-green-100 text-green-800",
        sizeClass[size],
        className
      )}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
