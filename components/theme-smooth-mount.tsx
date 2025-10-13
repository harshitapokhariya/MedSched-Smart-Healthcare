"use client"

import { useEffect } from "react"

export function ThemeSmoothMount() {
  useEffect(() => {
    const el = document.documentElement
    el.classList.add("theme-ready")
    return () => el.classList.remove("theme-ready")
  }, [])
  return null
}
