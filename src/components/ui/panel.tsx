import * as React from 'react'

import { cn } from '#/lib/utils'

/** Double-bezel container: outer shell + inner surface */
export function Panel({
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & { innerClassName?: string }) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] bg-mauve-05 p-1.5 ring-1 ring-border-subtle',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'rounded-[calc(1.75rem-0.375rem)] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function PanelHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-border-subtle px-6 py-5 sm:px-8', className)}
      {...props}
    />
  )
}

export function PanelBody({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('px-6 py-5 sm:px-8', className)} {...props} />
}
