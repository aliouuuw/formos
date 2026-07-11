import { cn } from '#/lib/utils'

export function PageHeader({
  kicker,
  title,
  description,
  badge,
  actions,
  className,
}: {
  kicker?: string
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 border-b border-mauve-10 pb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mauve-60">
            {kicker}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-night-80 sm:text-4xl">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="max-w-xl text-sm leading-7 text-night-60">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
