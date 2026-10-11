import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

export function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="wordmark" href="#">eprkilo</a>
        <div className="topbar-actions">
          <a href="#privacy">Privacy</a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>eprkilo is not affiliated with or endorsed by Etsy, Inc. Etsy is a trademark of Etsy, Inc.</p>
        <a href="#privacy">Privacy</a>
      </div>
    </footer>
  )
}

export function SampleBanner({ onUseOwn }: { onUseOwn: () => void }) {
  return (
    <div className="sample-banner" role="status">
      <div className="sample-banner-inner">
        <p>This is sample data, not your shop. Drop your own file to see your numbers.</p>
        <button type="button" className="btn btn-secondary" onClick={onUseOwn}>Use my own file</button>
      </div>
    </div>
  )
}

export function Layout({ banner, children }: { banner?: ReactNode; children: ReactNode }) {
  return (
    <>
      <TopBar />
      {banner}
      <main className="page">{children}</main>
      <Footer />
    </>
  )
}
