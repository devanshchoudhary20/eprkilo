import { useState } from 'react'
import { MoonIcon, SunIcon } from './icons'

const STORAGE_KEY = 'eprkilo-theme'

function currentTheme(): 'light' | 'dark' {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme)
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked: the choice lasts until reload
    }
  }

  return (
    <button type="button" className="icon-btn" aria-pressed={isDark} aria-label={label} title={label} onClick={toggle}>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
