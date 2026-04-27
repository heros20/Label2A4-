import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/support-publicite-label2a4"],
    },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  }
}
