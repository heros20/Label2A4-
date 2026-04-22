import type { Metadata } from "next"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { AdsenseManager } from "@/components/adsense-manager"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { SiteAnalytics } from "@/components/site-analytics"
import { SiteFooter } from "@/components/site-footer"
import { getAccessSnapshot } from "@/lib/access-control"
import { getAdsenseScriptUrl } from "@/lib/adsense"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

const brandImage = {
  url: siteConfig.brand.logoPng,
  width: siteConfig.brand.logoWidth,
  height: siteConfig.brand.logoHeight,
  alt: `Logo ${siteConfig.siteName}`,
}

const siteUrl = new URL(siteConfig.siteUrl)
const organizationId = new URL("#organization", siteUrl).toString()
const websiteId = new URL("#website", siteUrl).toString()
const brandLogoUrl = new URL(siteConfig.brand.logoPng, siteUrl).toString()

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
      logo: {
        "@type": "ImageObject",
        url: brandLogoUrl,
        width: siteConfig.brand.logoWidth,
        height: siteConfig.brand.logoHeight,
      },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
      description: siteConfig.description,
      publisher: {
        "@id": organizationId,
      },
      image: brandLogoUrl,
    },
  ],
}

async function getAdsenseHeadScriptUrl() {
  if (!siteConfig.compliance.adsEnabled) {
    return ""
  }

  const adsenseScriptUrl = getAdsenseScriptUrl(siteConfig.compliance.adsenseClientId)

  if (!adsenseScriptUrl) {
    return ""
  }

  const requestHeaders = new Headers(await headers())
  const forwardedHost = requestHeaders.get("x-forwarded-host")
  const host = forwardedHost ?? requestHeaders.get("host") ?? siteUrl.host
  const protocol = requestHeaders.get("x-forwarded-proto") ?? siteUrl.protocol.replace(":", "")

  try {
    const request = new NextRequest(`${protocol}://${host}/`, {
      headers: requestHeaders,
    })
    const response = new NextResponse()
    const access = await getAccessSnapshot(request, response)

    return access.isPremium ? "" : adsenseScriptUrl
  } catch (error) {
    console.warn("[label2a4-adsense-head]", error)
    return ""
  }
}

export const metadata: Metadata = {
  applicationName: siteConfig.siteName,
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.siteUrl),
  manifest: "/manifest.webmanifest",
  keywords: [
    "étiquette PDF A4",
    "imprimer plusieurs étiquettes sur une feuille",
    "Mondial Relay A4",
    "Colissimo A4",
    "Chronopost A4",
    "étiquette Vinted",
    "étiquette Leboncoin",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteConfig.siteUrl,
    siteName: siteConfig.siteName,
    title: siteConfig.siteName,
    description: siteConfig.description,
    images: [brandImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.siteName,
    description: siteConfig.description,
    images: [siteConfig.brand.logoPng],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: siteConfig.brand.faviconIco, sizes: "any", type: "image/x-icon" },
      { url: siteConfig.brand.logoSvg, type: "image/svg+xml" },
    ],
    shortcut: [{ url: siteConfig.brand.faviconIco, type: "image/x-icon" }],
    apple: [
      {
        url: siteConfig.brand.logoPng,
        sizes: `${siteConfig.brand.logoWidth}x${siteConfig.brand.logoHeight}`,
        type: "image/png",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  other: {
    "google-adsense-account": siteConfig.compliance.adsenseClientId,
    "msapplication-TileImage": siteConfig.brand.logoPng,
  },
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const adsenseHeadScriptUrl = await getAdsenseHeadScriptUrl()

  return (
    <html lang="fr">
      <head>
        {adsenseHeadScriptUrl && (
          <script async src={adsenseHeadScriptUrl} crossOrigin="anonymous" />
        )}
      </head>
      <body className="min-h-screen bg-[linear-gradient(180deg,#f4fbff_0%,#eef4f8_52%,#edf2f7_100%)] text-slate-950 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <AdsenseManager />
        <SiteAnalytics />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
