export function ExternalLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {href}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
