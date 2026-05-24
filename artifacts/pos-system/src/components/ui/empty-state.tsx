import { cn } from "@/lib/utils"

type EmptyStateProps = {
  icon?: React.ElementType
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

function EmptyState({ icon: Icon, title, description, className, children }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
          <Icon className="h-5 w-5 text-neutral-400" />
        </div>
      )}
      <p className="font-semibold text-neutral-700">{title}</p>
      {description && (
        <p className="max-w-xs text-sm text-neutral-400">{description}</p>
      )}
      {children}
    </div>
  )
}

export { EmptyState }
