import type { ChronopostVariantId, LabelProfileId, MondialRelayVariantId } from "@/lib/label-profiles"
import type { Locale } from "@/lib/i18n"

const profileDisplay = {
  fr: {
    chronopost: { title: "Chronopost", shortLabel: "Chronopost", description: "Format optimisé automatiquement." },
    colissimo: { title: "Colissimo", shortLabel: "Colissimo", description: "Format optimisé automatiquement." },
    "mondial-relay": {
      title: "Mondial Relay",
      shortLabel: "Mondial Relay",
      description: "Format optimisé automatiquement.",
    },
    "happy-post": { title: "Happy Post", shortLabel: "Happy Post", description: "Format optimisé automatiquement." },
    manual: { title: "Rognage manuel", shortLabel: "Manuel", description: "Sélection directe sur l’aperçu du PDF." },
  },
  en: {
    chronopost: { title: "Chronopost", shortLabel: "Chronopost", description: "Carrier layout applied automatically." },
    colissimo: { title: "Colissimo", shortLabel: "Colissimo", description: "Carrier layout applied automatically." },
    "mondial-relay": {
      title: "Mondial Relay",
      shortLabel: "Mondial Relay",
      description: "Carrier layout applied automatically.",
    },
    "happy-post": { title: "Happy Post", shortLabel: "Happy Post", description: "Carrier layout applied automatically." },
    manual: { title: "Manual adjustment", shortLabel: "Manual", description: "Select the useful area directly on the PDF preview." },
  },
} as const

const chronopostVariantDisplay = {
  fr: {
    standard: { title: "Standard", shortLabel: "Standard", description: "" },
    temu: { title: "Variante Temu", shortLabel: "Temu", description: "" },
  },
  en: {
    standard: { title: "Standard", shortLabel: "Standard", description: "" },
    temu: { title: "Temu variant", shortLabel: "Temu", description: "" },
  },
} as const

const mondialRelayVariantDisplay = {
  fr: {
    "variant-1": { title: "Variante 1", shortLabel: "V1", description: "Découpe principale" },
    "variant-2": { title: "Variante 2", shortLabel: "V2", description: "Découpe alternative" },
  },
  en: {
    "variant-1": { title: "Variant 1", shortLabel: "V1", description: "Primary layout" },
    "variant-2": { title: "Variant 2", shortLabel: "V2", description: "Alternative layout" },
  },
} as const

export function getProfileDisplay(locale: Locale, profileId: LabelProfileId) {
  return profileDisplay[locale][profileId]
}

export function getChronopostVariantDisplay(locale: Locale, variantId: ChronopostVariantId) {
  return chronopostVariantDisplay[locale][variantId]
}

export function getMondialRelayVariantDisplay(locale: Locale, variantId: MondialRelayVariantId) {
  return mondialRelayVariantDisplay[locale][variantId]
}
