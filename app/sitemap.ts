import type { MetadataRoute } from "next"
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

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.siteUrl).toString()
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: route.priority,
    })),
    ...seoPageList.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: page.path === "/landing" ? 0.95 : 0.85,
    })),
  ]
}
