import type { Metadata } from "next"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { SiteAnalytics } from "@/components/site-analytics"
import { SiteFooter } from "@/components/site-footer"
import { siteConfig } from "@/lib/site-config"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: siteConfig.siteName,
    template: `%s | ${siteConfig.siteName}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.siteUrl),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
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
