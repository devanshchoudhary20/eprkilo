import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Props = { label: string; className?: string; children: ReactNode }

// a scrolling region must take focus so keyboard users can reach its overflow; a region that fits adds no tab stop
export function Scroll({ label, className = 'scroll', children }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)
  const region = overflows ? { tabIndex: 0, role: 'region', 'aria-label': label } : {}

  const measure = () => {
    const el = ref.current
    if (el) setOverflows(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)
  }

  // runs after every render: children change size without the wrapper resizing
  useLayoutEffect(measure)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    Array.from(el.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className} {...region}>
      {children}
    </div>
  )
}
