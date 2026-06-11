import * as React from 'react'

import { cn } from '#/lib/utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-sm text-night ring-offset-background placeholder:text-text-placeholder focus-visible:border-mauve focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve/10 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
