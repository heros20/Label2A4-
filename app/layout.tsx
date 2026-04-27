import type { Metadata } from "next"
import { AdsenseManager } from "@/components/adsense-manager"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { LanguageSwitcher } from "@/components/language-switcher"
import { LocaleProvider } from "@/components/locale-provider"
import { SiteAnalytics } from "@/components/site-analytics"
import { SiteFooter } from "@/components/site-footer"
import { getOpenGraphLocale } from "@/lib/i18n"
import { getRequestLocale } from "@/lib/request-locale"
import { getSiteText } from "@/lib/site-copy"
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const siteText = getSiteText(locale)

  return {
    applicationName: siteConfig.siteName,
    title: {
      default: siteConfig.siteName,
      template: `%s | ${siteConfig.siteName}`,
    },
    description: siteText.description,
    metadataBase: new URL(siteConfig.siteUrl),
    manifest: "/manifest.webmanifest",
    keywords: [...siteText.keywords],
    openGraph: {
      type: "website",
      locale: getOpenGraphLocale(locale),
      url: siteConfig.siteUrl,
      siteName: siteConfig.siteName,
      title: siteConfig.siteName,
      description: siteText.socialTagline,
      images: [brandImage],
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.siteName,
      description: siteText.socialTagline,
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
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale()
  const siteText = getSiteText(locale)
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
        description: siteText.description,
        publisher: {
          "@id": organizationId,
        },
        image: brandLogoUrl,
      },
    ],
  }

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-[linear-gradient(180deg,#f4fbff_0%,#eef4f8_52%,#edf2f7_100%)] text-slate-950 antialiased">
        <LocaleProvider locale={locale}>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <div className="flex min-h-screen flex-col">
            <div className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
              <div className="mx-auto flex w-full max-w-[1440px] justify-end px-4 py-3 sm:px-6 lg:px-8">
                <LanguageSwitcher />
              </div>
            </div>
            <div className="flex-1">{children}</div>
            <SiteFooter locale={locale} />
          </div>
          <AdsenseManager />
          <SiteAnalytics />
          <CookieConsentBanner locale={locale} />
        </LocaleProvider>
      </body>
    </html>
  )
}
