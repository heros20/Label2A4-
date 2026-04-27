import type { PremiumPlanId } from "@/lib/monetization-types"

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function isConfiguredValue(value: string) {
  return Boolean(value.trim()) && !value.includes("À compléter") && !value.includes("a-completer")
}

const DEFAULT_GUEST_DAILY_A4_SHEETS = 2
const DEFAULT_FREE_ACCOUNT_DAILY_A4_SHEETS = 4
const DEFAULT_FREE_MAX_A4_SHEETS_PER_EXPORT = 1
const DEFAULT_FREE_MAX_PDF_FILES_PER_BATCH = 4

const configuredGuestDailySheets = readNumber(
  process.env.NEXT_PUBLIC_GUEST_DAILY_A4_SHEETS,
  DEFAULT_GUEST_DAILY_A4_SHEETS,
)
const configuredFreeAccountDailySheets = readNumber(
  process.env.NEXT_PUBLIC_FREE_ACCOUNT_DAILY_A4_SHEETS,
  DEFAULT_FREE_ACCOUNT_DAILY_A4_SHEETS,
)
const configuredAnonymousAbuseDailySheets = readNumber(
  process.env.ANONYMOUS_ABUSE_DAILY_A4_SHEETS,
  Math.max(configuredGuestDailySheets * 4, configuredFreeAccountDailySheets * 2),
)
const configuredFreeMaxSheetsPerExport = readNumber(
  process.env.NEXT_PUBLIC_FREE_MAX_A4_SHEETS_PER_EXPORT,
  DEFAULT_FREE_MAX_A4_SHEETS_PER_EXPORT,
)
const configuredFreeMaxPdfFilesPerBatch = readNumber(
  process.env.NEXT_PUBLIC_FREE_MAX_PDF_FILES_PER_BATCH,
  DEFAULT_FREE_MAX_PDF_FILES_PER_BATCH,
)

export const siteConfig = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Label2A4",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://label2a4.vercel.app",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Regroupez vos étiquettes PDF Chronopost, Colissimo, Mondial Relay et Happy Post sur des feuilles A4 x4 prêtes à imprimer.",
  socialTagline: "Fini le gaspillage. Imprime 4 étiquettes sur une seule feuille A4.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@label2a4.local",
  supportResponseDelay:
    process.env.NEXT_PUBLIC_SUPPORT_RESPONSE_DELAY ?? "Réponse sous 2 jours ouvrés.",
  business: {
    ownerName: process.env.NEXT_PUBLIC_OWNER_NAME ?? "À compléter",
    businessName: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "À compléter",
    legalForm: process.env.NEXT_PUBLIC_LEGAL_FORM ?? "À compléter",
    microEnterpriseStatus: process.env.NEXT_PUBLIC_MICRO_ENTERPRISE_STATUS ?? "À compléter",
    siren: process.env.NEXT_PUBLIC_SIREN ?? "À compléter",
    siret: process.env.NEXT_PUBLIC_SIRET ?? "À compléter",
    vatNumber: process.env.NEXT_PUBLIC_VAT_NUMBER ?? "À compléter",
    rcsStatus: process.env.NEXT_PUBLIC_RCS_STATUS ?? "À compléter",
    rneStatus: process.env.NEXT_PUBLIC_RNE_STATUS ?? "À compléter",
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "À compléter",
    publicationDirector: process.env.NEXT_PUBLIC_PUBLICATION_DIRECTOR ?? "À compléter",
  },
  host: {
    name: process.env.NEXT_PUBLIC_HOST_NAME ?? "Vercel Inc.",
    address:
      process.env.NEXT_PUBLIC_HOST_ADDRESS ??
      "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    website: process.env.NEXT_PUBLIC_HOST_WEBSITE ?? "https://vercel.com",
  },
  mediator: {
    name: process.env.NEXT_PUBLIC_MEDIATOR_NAME ?? "À compléter",
    website: process.env.NEXT_PUBLIC_MEDIATOR_WEBSITE ?? "À compléter",
    address: process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS ?? "À compléter",
  },
  pricing: {
    currency: "EUR",
    anonymousAbuseDailyA4Sheets: configuredAnonymousAbuseDailySheets,
    freeAccountDailyA4Sheets: configuredFreeAccountDailySheets,
    freeDailyA4Sheets: configuredFreeAccountDailySheets,
    freeMaxA4SheetsPerExport: configuredFreeMaxSheetsPerExport,
    freeMaxPdfFilesPerBatch: configuredFreeMaxPdfFilesPerBatch,
    guestDailyA4Sheets: configuredGuestDailySheets,
    monthlyPriceCents: readNumber(process.env.NEXT_PUBLIC_MONTHLY_PRICE_CENTS, 399),
    annualPriceCents: readNumber(process.env.NEXT_PUBLIC_ANNUAL_PRICE_CENTS, 2900),
    dayPassPriceCents: readNumber(process.env.NEXT_PUBLIC_DAY_PASS_PRICE_CENTS, 199),
  },
  compliance: {
    adsEnabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
    adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? "ca-pub-6958980790642483",
    optionalTrackersEnabled: process.env.NEXT_PUBLIC_OPTIONAL_TRACKERS_ENABLED === "true",
  },
  dataHandling: {
    keepUploadedPdfs: process.env.NEXT_PUBLIC_KEEP_UPLOADED_PDFS === "true",
    technicalLogRetentionDays: readNumber(process.env.NEXT_PUBLIC_TECH_LOG_RETENTION_DAYS, 30),
  },
  launch: {
    stripeEnabled: process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true",
  },
  auth: {
    googleOAuthEnabled: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true",
  },
  brand: {
    appleTouchIconPng: "/images/logo/apple-touch-icon.png",
    favicon16Png: "/images/logo/favicon-16x16.png",
    favicon32Png: "/images/logo/favicon-32x32.png",
    logoSvg: "/images/logo/label2a4.svg",
    logoPng: "/images/logo/label2a4.png",
    logoMarkPng: "/images/logo/label2a4-mark.png",
    faviconIco: "/favicon.ico",
    webAppIcon192Png: "/images/logo/android-chrome-192x192.png",
    webAppIcon512Png: "/images/logo/android-chrome-512x512.png",
    logoWidth: 2760,
    logoHeight: 1504,
  },
} as const

export const requiredBusinessFields = [
  siteConfig.business.ownerName,
  siteConfig.business.businessName,
  siteConfig.business.legalForm,
  siteConfig.business.microEnterpriseStatus,
  siteConfig.business.siren,
  siteConfig.business.siret,
  siteConfig.business.address,
  siteConfig.business.publicationDirector,
] as const

export function formatEuroFromCents(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: siteConfig.pricing.currency,
  }).format(amount / 100)
}

export function getPlanLabel(planId: PremiumPlanId) {
  if (planId === "monthly") {
    return "Abonnement mensuel"
  }

  if (planId === "annual") {
    return "Abonnement annuel"
  }

  return "Pass 24h"
}

export function getPlanPriceLabel(planId: PremiumPlanId) {
  if (planId === "monthly") {
    return formatEuroFromCents(siteConfig.pricing.monthlyPriceCents)
  }

  if (planId === "annual") {
    return formatEuroFromCents(siteConfig.pricing.annualPriceCents)
  }

  return formatEuroFromCents(siteConfig.pricing.dayPassPriceCents)
}

export function getBusinessReadinessItems() {
  return {
    businessIdentityReady: requiredBusinessFields.every(isConfiguredValue),
    mediatorReady: [
      siteConfig.mediator.name,
      siteConfig.mediator.website,
      siteConfig.mediator.address,
    ].every(isConfiguredValue),
    supportReady: isConfiguredValue(siteConfig.supportEmail),
  }
}

export function getMissingPublicConfigurationItems() {
  const missing: string[] = []
  const readiness = getBusinessReadinessItems()

  if (!readiness.businessIdentityReady) {
    missing.push("coordonnées légales de l’entreprise")
  }

  if (!readiness.mediatorReady) {
    missing.push("médiateur de la consommation")
  }

  if (!readiness.supportReady) {
    missing.push("email de support")
  }

  return missing
}
