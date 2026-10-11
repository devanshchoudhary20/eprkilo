import type { ReactNode } from 'react'

type Props = { label: string; className?: string; children: ReactNode }

// a scrolling region must take focus so keyboard users can reach its overflow
export function Scroll({ label, className = 'scroll', children }: Props) {
  return (
    <div className={className} tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  )
}
