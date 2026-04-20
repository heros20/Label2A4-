import type { Metadata } from "next"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { SiteAnalytics } from "@/components/site-analytics"
import { SiteFooter } from "@/components/site-footer"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

export const metadata: Metadata = {
  applicationName: siteConfig.siteName,
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.siteUrl),
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
  },
  twitter: {
    card: "summary",
    title: siteConfig.siteName,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[linear-gradient(180deg,#f4fbff_0%,#eef4f8_52%,#edf2f7_100%)] text-slate-950 antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <SiteAnalytics />
        <CookieConsentBanner />
      </body>
    </html>
  )
}
