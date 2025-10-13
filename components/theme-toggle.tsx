"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const current = theme === "system" ? systemTheme : theme
  const isDark = current === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative group transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-ring/60 focus-visible:ring-2"
    >
      {/* sun */}
      <span
        className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.85)" }}
        aria-hidden
      >
        <Sun className="size-4 [filter:drop-shadow(0_0_6px_color-mix(in_oklab,oklch(var(--color-accent))_60%,transparent))]" />
      </span>
      {/* moon */}
      <span
        className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{ opacity: isDark ? 0 : 1, transform: isDark ? "rotate(90deg) scale(0.85)" : "rotate(0deg) scale(1)" }}
        aria-hidden
      >
        <Moon className="size-4 [filter:drop-shadow(0_0_6px_color-mix(in_oklab,oklch(var(--color-accent))_45%,transparent))]" />
      </span>
      <span className="sr-only">{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
    </Button>
  )
}
