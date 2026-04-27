import type { Locale } from "@/lib/i18n"

const siteCopy = {
  fr: {
    description:
      "Regroupez vos étiquettes PDF Chronopost, Colissimo, Mondial Relay et Happy Post sur des feuilles A4 x4 prêtes à imprimer.",
    keywords: [
      "étiquette PDF A4",
      "étiquettes colis",
      "imprimer étiquettes",
      "imprimer plusieurs étiquettes sur une feuille",
      "4 étiquettes sur une feuille A4",
      "économie papier",
      "économiser papier et encre",
      "Mondial Relay A4",
      "Colissimo A4",
      "Chronopost A4",
      "Happy Post A4",
      "étiquette Vinted",
      "étiquette Leboncoin",
    ],
    supportResponseDelay: "Réponse sous 2 jours ouvrés.",
    socialTagline: "Fini le gaspillage. Imprime 4 étiquettes sur une seule feuille A4.",
  },
  en: {
    description:
      "Group your Chronopost, Colissimo, Mondial Relay and Happy Post PDF shipping labels onto ready-to-print A4 x4 sheets.",
    keywords: [
      "shipping labels",
      "PDF labels on A4",
      "print 4 labels on one A4 sheet",
      "carrier labels",
      "A4 shipping label tool",
      "save paper",
      "reduce waste",
      "Chronopost labels",
      "Colissimo labels",
      "Mondial Relay labels",
      "Happy Post labels",
      "Vinted labels",
      "Leboncoin labels",
    ],
    supportResponseDelay: "Reply within 2 business days.",
    socialTagline: "Stop wasting paper. Print up to 4 labels on one A4 sheet.",
  },
} as const

export function getSiteText(locale: Locale) {
  return siteCopy[locale]
}
