"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/components/locale-provider"
import {
  PREFERRED_LOCALE_COOKIE_NAME,
  getAlternateLocalePath,
  getPathLocale,
  type Locale,
} from "@/lib/i18n"

const SWITCHER_STORAGE_KEY = "label2a4-preferred-locale"

function setPreferredLocale(locale: Locale) {
  try {
    window.localStorage.setItem(SWITCHER_STORAGE_KEY, locale)
  } catch {
    // Ignore storage failures.
  }

  document.cookie = `${PREFERRED_LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeLocale = useLocale()
  const [hash, setHash] = useState("")

  useEffect(() => {
    setHash(window.location.hash)
  }, [])

  const currentPath = useMemo(() => {
    const query = searchParams.toString()
    return `${pathname || "/"}${query ? `?${query}` : ""}${hash}`
  }, [hash, pathname, searchParams])

  const frHref = getAlternateLocalePath(currentPath, "fr")
  const enHref = getAlternateLocalePath(currentPath, "en")
  const resolvedLocale = pathname ? getPathLocale(pathname) : activeLocale

  return (
    <nav
      aria-label={resolvedLocale === "fr" ? "Sélecteur de langue" : "Language switcher"}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/88 p-1 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl"
    >
      {[
        { href: frHref, label: "FR", locale: "fr" as const },
        { href: enHref, label: "EN", locale: "en" as const },
      ].map((item) => {
        const isActive = resolvedLocale === item.locale

        return (
          <Link
            key={item.locale}
            href={item.href}
            hrefLang={item.locale}
            lang={item.locale}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isActive ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
            onClick={() => setPreferredLocale(item.locale)}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
