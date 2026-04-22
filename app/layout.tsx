import type { Metadata } from "next"
import { AdsenseManager } from "@/components/adsense-manager"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { SiteAnalytics } from "@/components/site-analytics"
import { SiteFooter } from "@/components/site-footer"
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
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
