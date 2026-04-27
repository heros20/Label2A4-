import type { Metadata } from "next"
import { getLocaleHrefLang, getOpenGraphLocale, localizePath, type Locale } from "@/lib/i18n"
import { siteConfig } from "@/lib/site-config"

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.siteUrl).toString()
}

export function buildPageMetadata({
  description,
  locale,
  path,
  title,
}: {
  description: string
  locale: Locale
  path: string
  title: string
}): Metadata {
  const localizedPath = localizePath(path, locale)
  const canonical = absoluteUrl(localizedPath)
  const fullTitle = `${title} | ${siteConfig.siteName}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        [getLocaleHrefLang("fr")]: absoluteUrl(localizePath(path, "fr")),
        [getLocaleHrefLang("en")]: absoluteUrl(localizePath(path, "en")),
      },
    },
    openGraph: {
      type: "website",
      locale: getOpenGraphLocale(locale),
      url: canonical,
      siteName: siteConfig.siteName,
      title: fullTitle,
      description,
      images: [siteConfig.brand.logoPng],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [siteConfig.brand.logoPng],
    },
  }
}
