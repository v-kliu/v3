'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { m } from 'motion/react'
import { cn } from '@/lib/utils'

// shadcn checkbox with an animated stroke-drawn check; `color` tints the fill
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { color?: string }
>(({ className, color = 'var(--text)', checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={checked}
    className={cn(
      'peer grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40',
      className
    )}
    style={{
      borderColor: color,
      background: checked ? color : 'transparent',
    }}
    {...props}
  >
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" aria-hidden>
      <m.path
        d="M3.5 8.5l3 3 6-7"
        stroke="#fff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      />
    </svg>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
