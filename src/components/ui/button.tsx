import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '#/lib/utils'

const buttonVariants = cva(
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium tracking-wide transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'rounded-full bg-gold text-white hover:-translate-y-px hover:brightness-105 hover:shadow-[0_8px_24px_rgba(203,152,36,0.24)] focus-visible:shadow-[0_0_0_3px_var(--jaune-or-20),0_0_0_1px_var(--jaune-or)]',
        everest:
          'rounded-full bg-everest-green text-white hover:-translate-y-px hover:shadow-[var(--shadow-card-lift)] focus-visible:shadow-[0_0_0_3px_var(--everest-green-10),0_0_0_1px_var(--everest-green)]',
        mauve:
          'rounded-full bg-mauve text-white hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(70,29,76,0.2)] focus-visible:shadow-[0_0_0_3px_var(--mauve-10),0_0_0_1px_var(--mauve)]',
        secondary:
          'rounded-full border border-mauve/20 bg-white text-mauve hover:border-mauve hover:bg-mauve-05',
        outline:
          'rounded-full border border-everest-green/20 bg-white text-everest-green hover:border-everest-green hover:bg-everest-green-05',
        ghost:
          'rounded-full text-night-60 hover:bg-mauve-05 hover:text-mauve',
        destructive: 'rounded-full bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-11 px-6 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function ButtonArrow() {
  return (
    <span className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-px">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3 7h8M8 4l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  showArrow?: boolean
}

export function Button({
  className,
  variant,
  size,
  showArrow,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {children}
      {showArrow ? <ButtonArrow /> : null}
    </button>
  )
}
