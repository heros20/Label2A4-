import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.siteName,
    short_name: siteConfig.siteName,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fbfd",
    theme_color: "#0369a1",
    icons: [
      {
        src: siteConfig.brand.logoMarkPng,
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: siteConfig.brand.faviconIco,
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: siteConfig.brand.logoSvg,
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: siteConfig.brand.logoPng,
        sizes: `${siteConfig.brand.logoWidth}x${siteConfig.brand.logoHeight}`,
        type: "image/png",
      },
    ],
  }
}
