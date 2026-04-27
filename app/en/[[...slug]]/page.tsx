import { notFound } from "next/navigation"
import { LandingPageContent, getLandingPageContent } from "@/components/pages/landing-page-content"
import {
  AccountPageContent,
  CancellationPageContent,
  ConnexionPageContent,
  ContactPageContent,
  CookiesPageContent,
  FaqPageContent,
  ForgotPasswordPageContent,
  getAccountStatusMessage,
  InscriptionPageContent,
  LegalNoticePageContent,
  PaymentCancelledPageContent,
  PaymentSuccessPageContent,
  PricingPageContent,
  PrivacyPageContent,
  RefundPageContent,
  ResetPasswordPageContent,
  TermsPageContent,
} from "@/components/pages/public-pages"
import { HomeTool } from "@/components/home-tool"
import { SavingsSimulator } from "@/components/savings-simulator"
import { SeoServicePage } from "@/components/seo-service-page"
import { buildPageMetadata } from "@/lib/page-metadata"
import { getSeoMetadata, getSeoPage, type SeoPageKey } from "@/lib/seo-pages"
import { getSiteText } from "@/lib/site-copy"
import { localizePath } from "@/lib/i18n"

const locale = "en" as const

type RouteParams = {
  slug?: string[]
}

type RouteSearchParams = {
  next?: string | string[]
  status?: string | string[]
}

const staticEnglishPaths: Array<string[]> = [
  [],
  ["landing"],
  ["tarifs"],
  ["faq"],
  ["contact"],
  ["compte"],
  ["connexion"],
  ["inscription"],
  ["mot-de-passe-oublie"],
  ["mentions-legales"],
  ["cookies"],
  ["remboursement"],
  ["resiliation"],
  ["confidentialite"],
  ["cgv"],
  ["chronopost"],
  ["colissimo"],
  ["happy-post"],
  ["leboncoin"],
  ["mondial-relay"],
  ["vinted"],
  ["entreprises"],
  ["economies"],
  ["paiement", "succes"],
  ["paiement", "annule"],
  ["auth", "reset-password"],
]

const seoPageKeys = new Set<SeoPageKey>([
  "chronopost",
  "colissimo",
  "happy-post",
  "leboncoin",
  "mondial-relay",
  "vinted",
  "entreprises",
  "economies",
])

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function getSafePath(value: string | undefined, fallback = localizePath("/compte", locale)) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback
}

function resolveMetadata(segments: string[]) {
  const path = segments.join("/")

  if (segments.length === 0) {
    return buildPageMetadata({
      title: "PDF shipping labels on A4 x4",
      description: getSiteText(locale).description,
      path: "/",
      locale,
    })
  }

  if (seoPageKeys.has(path as SeoPageKey)) {
    const page = getSeoPage(path as SeoPageKey, locale)
    return getSeoMetadata(page, locale)
  }

  switch (path) {
    case "landing": {
      const landing = getLandingPageContent(locale)
      return buildPageMetadata({
        title: landing.title,
        description: landing.description,
        path: "/landing",
        locale,
      })
    }
    case "tarifs":
      return buildPageMetadata({
        title: "Pricing",
        description: "Compare the free plan, 24-hour pass and subscriptions for exporting your shipping labels on optimized A4 sheets.",
        path: "/tarifs",
        locale,
      })
    case "faq":
      return buildPageMetadata({
        title: "FAQ",
        description: "Frequently asked questions about Label2A4, free quotas, premium plans and shipping label PDF preparation.",
        path: "/faq",
        locale,
      })
    case "contact":
      return buildPageMetadata({
        title: "Support",
        description: "Contact Label2A4 support for an unsupported label, a PDF issue or a subscription question.",
        path: "/contact",
        locale,
      })
    case "compte":
      return buildPageMetadata({
        title: "My account",
        description: "Find your premium access, quota, purchases and billing details in your Label2A4 account area.",
        path: "/compte",
        locale,
      })
    case "connexion":
      return buildPageMetadata({
        title: "Sign in",
        description: "Sign in to your Label2A4 account to access premium exports, quota details and billing.",
        path: "/connexion",
        locale,
      })
    case "inscription":
      return buildPageMetadata({
        title: "Create account",
        description: "Create your Label2A4 account to keep your purchases, quotas and invoices in one place.",
        path: "/inscription",
        locale,
      })
    case "mot-de-passe-oublie":
      return buildPageMetadata({
        title: "Forgot password",
        description: "Receive a secure email to set a new Label2A4 password.",
        path: "/mot-de-passe-oublie",
        locale,
      })
    case "mentions-legales":
      return buildPageMetadata({
        title: "Legal notice",
        description: "Legal notice for Label2A4: site publisher, hosting, mediation and legal information.",
        path: "/mentions-legales",
        locale,
      })
    case "cookies":
      return buildPageMetadata({
        title: "Cookies",
        description: "Information about the technical cookies used by Label2A4 for access, quotas and service operation.",
        path: "/cookies",
        locale,
      })
    case "remboursement":
      return buildPageMetadata({
        title: "Refund policy",
        description: "How to request a Label2A4 refund and which information to provide.",
        path: "/remboursement",
        locale,
      })
    case "resiliation":
      return buildPageMetadata({
        title: "Cancellation",
        description: "Cancel your Label2A4 subscription from your account or through the billing portal.",
        path: "/resiliation",
        locale,
      })
    case "confidentialite":
      return buildPageMetadata({
        title: "Privacy policy",
        description: "Label2A4 privacy policy covering processed data, purposes, retention and user rights.",
        path: "/confidentialite",
        locale,
      })
    case "cgv":
      return buildPageMetadata({
        title: "Terms and conditions of sale",
        description: "Label2A4 terms and conditions of sale covering plans, payment, cancellation, withdrawal and refunds.",
        path: "/cgv",
        locale,
      })
    case "paiement/succes":
      return buildPageMetadata({
        title: "Payment confirmed",
        description: "Your Label2A4 payment was confirmed. Your premium access is now available from your account.",
        path: "/paiement/succes",
        locale,
      })
    case "paiement/annule":
      return buildPageMetadata({
        title: "Payment cancelled",
        description: "Your Label2A4 premium payment was not completed. You can keep using the free plan or restart checkout.",
        path: "/paiement/annule",
        locale,
      })
    case "auth/reset-password":
      return buildPageMetadata({
        title: "New password",
        description: "Choose a new password to secure your Label2A4 account.",
        path: "/auth/reset-password",
        locale,
      })
    default:
      return null
  }
}

export function generateStaticParams() {
  return staticEnglishPaths.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }) {
  const { slug = [] } = await params
  const metadata = resolveMetadata(slug)

  if (!metadata) {
    return {}
  }

  return metadata
}

interface EnglishPageProps {
  params: Promise<RouteParams>
  searchParams: Promise<RouteSearchParams>
}

export default async function EnglishPage({ params, searchParams }: EnglishPageProps) {
  const { slug = [] } = await params
  const query = await searchParams
  const path = slug.join("/")

  if (slug.length === 0) {
    return <HomeTool locale={locale} />
  }

  if (seoPageKeys.has(path as SeoPageKey)) {
    const page = getSeoPage(path as SeoPageKey, locale)

    if (path === "economies") {
      return (
        <SeoServicePage page={page} locale={locale}>
          <SavingsSimulator locale={locale} />
        </SeoServicePage>
      )
    }

    return <SeoServicePage page={page} locale={locale} />
  }

  switch (path) {
    case "landing":
      return <LandingPageContent locale={locale} />
    case "tarifs":
      return <PricingPageContent locale={locale} />
    case "faq":
      return <FaqPageContent locale={locale} />
    case "contact":
      return <ContactPageContent locale={locale} />
    case "compte":
      return (
        <AccountPageContent
          locale={locale}
          statusMessage={getAccountStatusMessage(locale, getSearchParamValue(query.status))}
        />
      )
    case "connexion":
      return <ConnexionPageContent locale={locale} />
    case "inscription":
      return <InscriptionPageContent locale={locale} />
    case "mot-de-passe-oublie":
      return <ForgotPasswordPageContent locale={locale} />
    case "mentions-legales":
      return <LegalNoticePageContent locale={locale} />
    case "cookies":
      return <CookiesPageContent locale={locale} />
    case "remboursement":
      return <RefundPageContent locale={locale} />
    case "resiliation":
      return <CancellationPageContent locale={locale} />
    case "confidentialite":
      return <PrivacyPageContent locale={locale} />
    case "cgv":
      return <TermsPageContent locale={locale} />
    case "paiement/succes":
      return <PaymentSuccessPageContent locale={locale} />
    case "paiement/annule":
      return <PaymentCancelledPageContent locale={locale} />
    case "auth/reset-password":
      return (
        <ResetPasswordPageContent
          initialIsFirstLogin={getSearchParamValue(query.status) === "first-login"}
          locale={locale}
          nextPath={getSafePath(getSearchParamValue(query.next))}
        />
      )
    default:
      notFound()
  }
}
