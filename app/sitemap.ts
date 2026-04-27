import type { MetadataRoute } from "next"
import { LOCALES, localizePath } from "@/lib/i18n"
import { seoPageList } from "@/lib/seo-pages"
import { siteConfig } from "@/lib/site-config"

const staticRoutes = [
  { path: "/", priority: 1 },
  { path: "/landing", priority: 0.95 },
  { path: "/tarifs", priority: 0.7 },
  { path: "/faq", priority: 0.65 },
  { path: "/contact", priority: 0.35 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/cgv", priority: 0.2 },
  { path: "/confidentialite", priority: 0.2 },
  { path: "/cookies", priority: 0.2 },
  { path: "/resiliation", priority: 0.2 },
] as const

const staticRoutePaths = new Set<string>(staticRoutes.map((route) => route.path))

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.siteUrl).toString()
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    ...LOCALES.flatMap((locale) =>
      staticRoutes.map((route) => ({
        url: absoluteUrl(localizePath(route.path, locale)),
        lastModified,
        changeFrequency: "monthly" as const,
        priority: route.priority,
      })),
    ),
    ...LOCALES.flatMap((locale) =>
      seoPageList
        .filter((page) => !staticRoutePaths.has(page.path))
        .map((page) => ({
          url: absoluteUrl(localizePath(page.path, locale)),
          lastModified,
          changeFrequency: "monthly" as const,
          priority: 0.85,
        })),
    ),
  ]
}
