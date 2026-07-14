import * as React from 'react'

import { cn } from '#/lib/utils'

/** Admin / product surface — soft green hairline + green-tinted lift (Everest Summit) */
export function Panel({
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & { innerClassName?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-everest-green/10 bg-card text-card-foreground shadow-[0_8px_24px_rgba(1,45,42,0.06)]',
        className,
      )}
      {...props}
    >
      <div className={cn(innerClassName)}>{children}</div>
    </div>
  )
}

export function PanelHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-b border-everest-green/10 px-6 py-5 sm:px-8', className)}
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
