import { SidebarTrigger } from '#/components/admin/admin-sidebar'
import { cn } from '#/lib/utils'

export function PageHeader({
  kicker,
  title,
  description,
  badge,
  actions,
  className,
  showSidebarTrigger = true,
}: {
  kicker?: string
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  /** Show admin sidebar toggle when inside the admin shell (default: true) */
  showSidebarTrigger?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 border-b border-everest-green/10 pb-8 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {showSidebarTrigger ? <SidebarTrigger className="mt-1.5 shrink-0" /> : null}
        <div className="max-w-2xl min-w-0 space-y-3">
          {kicker ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mauve-60">
              {kicker}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-[-0.02em] text-everest-green sm:text-4xl">
              {title}
            </h1>
            {badge}
          </div>
          {description ? (
            <p className="max-w-xl text-sm leading-7 text-night-60">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
