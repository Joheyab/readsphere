"use client"

import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ThemeLanguageToggle() {
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const mount = () => setMounted(true)
    mount()
  }, [])

  if (!mounted)
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-input" />
        <div className="w-10 h-7 rounded-lg bg-input" />
      </div>
    )

  function toggleLocale() {
    const next = locale === "es" ? "en" : "es"
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg bg-input dark:bg-input hover:bg-zinc-700 text-secondary hover:text-app transition"
        title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      >
        {theme === "dark" ? (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {/* Language toggle */}
      <button
        onClick={toggleLocale}
        className="px-2 py-2 rounded-lg bg-input dark:bg-input hover:bg-zinc-700 text-secondary hover:text-app text-xs font-medium transition"
        title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
    </div>
  )
}
