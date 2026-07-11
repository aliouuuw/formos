import { cn } from '#/lib/utils'

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-mauve/20 bg-mauve-05 px-6 py-14 text-center',
        className,
      )}
    >
      <p className="text-base font-semibold text-night-80">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-night-60">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
