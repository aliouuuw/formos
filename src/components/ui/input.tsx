import * as React from 'react'

import { cn } from '#/lib/utils'

export function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-mauve/15 bg-white px-3 py-2 text-sm text-night ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-night-40 focus-visible:border-mauve focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mauve/10 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
