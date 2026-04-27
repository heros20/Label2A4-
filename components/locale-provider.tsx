"use client"

import { createContext, useContext } from "react"
import type { Locale } from "@/lib/i18n"

const LocaleContext = createContext<Locale>("fr")

export function LocaleProvider({
  children,
  locale,
}: Readonly<{
  children: React.ReactNode
  locale: Locale
}>) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  return useContext(LocaleContext)
}
