import { cn } from "@/lib/utils"

type StatusBadgeProps = React.ComponentProps<"span">

function StatusBadge({ className, children, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { StatusBadge }
