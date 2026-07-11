import * as React from 'react'

import { cn } from '#/lib/utils'

/** Clean card container */
export function Panel({
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<'div'> & { innerClassName?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_1px_2px_rgba(28,20,29,0.03),0_8px_24px_rgba(28,20,29,0.04)]',
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
