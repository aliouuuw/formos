import { Badge } from '#/components/ui/badge'
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
        'flex flex-col gap-5 border-b border-mauve-10 pb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        {kicker ? (
          <Badge variant="mauve" className="normal-case tracking-[0.22em]">
            {kicker}
          </Badge>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-night-80 sm:text-4xl">
            {title}
          </h1>
          {badge}
        </div>
        {description ? (
          <p className="max-w-xl text-base leading-relaxed text-night-60">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
