import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-gold-20 bg-gold-10 text-gold',
        mauve: 'border-mauve/20 bg-mauve-10 text-mauve',
        everest: 'border-everest-green/20 bg-everest-green-10 text-everest-green',
        secondary: 'border-everest-green/15 bg-everest-green-05 text-everest-green-60',
        outline: 'border-[var(--command-border)] text-night-60',
        success: 'border-everest-green/20 bg-everest-green-10 text-everest-green',
        warning: 'border-gold-20 bg-gold-10 text-gold',
      },
    },
    defaultVariants: {
      variant: 'everest',
    },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
