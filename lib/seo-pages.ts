import type { Metadata } from "next"
import { siteConfig } from "@/lib/site-config"

export interface SeoFaq {
  question: string
  answer: string
}

export interface SeoPageContent {
  path: string
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  intro: string
  highlights: string[]
  problem: {
    title: string
    text: string
  }
  solution: {
    title: string
    text: string
  }
  useCases: Array<{
    title: string
    text: string
  }>
  economy: {
    title: string
    text: string
  }
  steps: string[]
  faqs: SeoFaq[]
  ctaLabel: string
}

export const seoPages = {
  "mondial-relay": {
    path: "/mondial-relay",
    metaTitle: "Imprimer une étiquette Mondial Relay sur A4",
    metaDescription:
      "Rognez et regroupez vos étiquettes Mondial Relay PDF sur des feuilles A4 x4 prêtes à imprimer avec Label2A4.",
    eyebrow: "Mondial Relay",
    title: "Imprimer une étiquette Mondial Relay sur une feuille A4",
    intro:
      "Les étiquettes Mondial Relay arrivent souvent en PDF isolé. Label2A4 les rogne puis les place proprement sur une feuille A4, jusqu’à quatre étiquettes par page.",
    highlights: ["Rognage Mondial Relay", "Placement A4 x4", "PDF prêt à imprimer"],
    problem: {
      title: "Un PDF par colis consomme vite trop de papier",
      text:
        "Quand chaque étiquette Mondial Relay est imprimée sur une page entière, trois quarts de la feuille restent inutilisés. Sur plusieurs colis, le gaspillage devient visible.",
    },
    solution: {
      title: "Une planche A4 optimisée pour vos dépôts",
      text:
        "Importez vos PDF, choisissez le profil Mondial Relay, puis récupérez une planche A4 avec quatre emplacements propres. Vous gardez le rendu transporteur tout en réduisant les impressions.",
    },
    useCases: [
      {
        title: "Vendeurs Vinted",
        text: "Préparez plusieurs ventes du jour sans lancer une impression complète pour chaque bordereau.",
      },
      {
        title: "Petits e-commerçants",
        text: "Traitez les lots Mondial Relay récurrents avec moins de feuilles et une sortie plus facile à découper.",
      },
      {
        title: "Envois ponctuels",
        text: "Gardez une méthode simple quand vous avez deux, trois ou quatre colis à déposer en même temps.",
      },
    ],
    economy: {
      title: "Jusqu’à 75% de feuilles en moins",
      text:
        "Avec quatre étiquettes par feuille A4, un lot de 40 colis peut passer de 40 feuilles à environ 10 feuilles, selon le nombre d’étiquettes.",
    },
    steps: [
      "Importez vos PDF Mondial Relay dans l’outil.",
      "Sélectionnez le profil Mondial Relay et la variante adaptée.",
      "Téléchargez le PDF A4 x4 prêt pour l’impression.",
    ],
    faqs: [
      {
        question: "Comment imprimer une étiquette Mondial Relay sur A4 ?",
        answer:
          "Importez le PDF Mondial Relay dans Label2A4, choisissez le profil Mondial Relay, puis exportez la planche A4 générée.",
      },
      {
        question: "Peut-on mettre plusieurs étiquettes Mondial Relay sur une page ?",
        answer:
          "Oui. L’outil regroupe jusqu’à quatre étiquettes sur une feuille A4, selon le nombre de PDF importés.",
      },
    ],
    ctaLabel: "Optimiser mes étiquettes Mondial Relay",
  },
  colissimo: {
    path: "/colissimo",
    metaTitle: "Réduire et imprimer une étiquette Colissimo sur A4",
    metaDescription:
      "Transformez vos étiquettes Colissimo PDF en planches A4 x4 pour économiser du papier et imprimer plus proprement.",
    eyebrow: "Colissimo",
    title: "Réduire une étiquette Colissimo et l’imprimer sur A4",
    intro:
      "Label2A4 prépare vos étiquettes Colissimo pour une impression A4 plus compacte, sans refaire votre bordereau ni modifier le contenu du PDF.",
    highlights: ["Profil Colissimo", "A4 x4", "Découpe simple"],
    problem: {
      title: "Les bordereaux Colissimo prennent souvent une page entière",
      text:
        "Pour un vendeur régulier, imprimer chaque étiquette seule multiplie les feuilles, le temps de découpe et le coût d’impression.",
    },
    solution: {
      title: "Un PDF optimisé avec quatre emplacements",
      text:
        "L’outil rogne la zone utile de l’étiquette Colissimo puis compose une page A4 avec un placement régulier, plus simple à imprimer et à découper.",
    },
    useCases: [
      {
        title: "Ventes entre particuliers",
        text: "Regroupez les envois Colissimo d’une journée sur une sortie plus compacte.",
      },
      {
        title: "Boutiques en ligne",
        text: "Réduisez la consommation de papier quand plusieurs commandes partent avec Colissimo.",
      },
      {
        title: "Préparation de lots",
        text: "Gardez un PDF final unique pour imprimer, vérifier puis découper vos étiquettes.",
      },
    ],
    economy: {
      title: "Moins de papier sur les volumes réguliers",
      text:
        "Un lot de 20 étiquettes peut nécessiter environ 5 feuilles au lieu de 20 avec un placement quatre par page.",
    },
    steps: [
      "Ajoutez les PDF Colissimo dans l’ordre voulu.",
      "Choisissez le profil Colissimo.",
      "Générez puis téléchargez la planche A4 finale.",
    ],
    faqs: [
      {
        question: "Comment réduire une étiquette Colissimo ?",
        answer:
          "Utilisez le profil Colissimo de Label2A4 pour rogner la zone utile et replacer l’étiquette sur une feuille A4.",
      },
      {
        question: "Le code-barres Colissimo reste-t-il lisible ?",
        answer:
          "L’objectif est de conserver un rendu net et imprimable. Vérifiez toujours l’aperçu final avant impression, surtout avec un PDF source de faible qualité.",
      },
    ],
    ctaLabel: "Préparer mes étiquettes Colissimo",
  },
  chronopost: {
    path: "/chronopost",
    metaTitle: "Imprimer plusieurs étiquettes Chronopost sur A4",
    metaDescription:
      "Placez vos étiquettes Chronopost PDF sur une feuille A4 x4 pour limiter les impressions et préparer vos expéditions.",
    eyebrow: "Chronopost",
    title: "Imprimer plusieurs étiquettes Chronopost sur une feuille A4",
    intro:
      "Pour les expéditions rapides et les lots du jour, Label2A4 transforme vos PDF Chronopost en planches A4 plus denses et prêtes à imprimer.",
    highlights: ["Profil Chronopost", "Lot multi-PDF", "Sortie A4"],
    problem: {
      title: "Les impressions Chronopost s’accumulent vite",
      text:
        "Quand les commandes partent en volume, une feuille par étiquette ajoute du coût, du papier et des manipulations inutiles.",
    },
    solution: {
      title: "Une planche claire pour quatre étiquettes",
      text:
        "Importez vos PDF Chronopost, laissez l’outil appliquer le rognage adapté, puis imprimez un PDF final regroupé sur A4.",
    },
    useCases: [
      {
        title: "Expéditions express",
        text: "Préparez les envois urgents avec une sortie unique et lisible.",
      },
      {
        title: "Opérations commerciales",
        text: "Réduisez les impressions lors des pics de commandes ou des campagnes ponctuelles.",
      },
      {
        title: "Back-office e-commerce",
        text: "Simplifiez la préparation des lots sans changer le transporteur ni le PDF source.",
      },
    ],
    economy: {
      title: "Un gain concret dès les premiers lots",
      text:
        "Même avec quelques dizaines d’étiquettes par mois, le passage en A4 x4 peut réduire fortement les feuilles imprimées.",
    },
    steps: [
      "Déposez vos PDF Chronopost.",
      "Sélectionnez le profil Chronopost.",
      "Téléchargez la planche A4 prête à imprimer.",
    ],
    faqs: [
      {
        question: "Peut-on regrouper plusieurs étiquettes Chronopost ?",
        answer:
          "Oui. Label2A4 accepte plusieurs PDF et compose une sortie A4 avec jusqu’à quatre étiquettes par feuille.",
      },
      {
        question: "Faut-il modifier le fichier Chronopost original ?",
        answer:
          "Non. Vous importez le PDF tel quel, puis l’outil génère un nouveau PDF A4 optimisé.",
      },
    ],
    ctaLabel: "Optimiser mes étiquettes Chronopost",
  },
  "happy-post": {
    path: "/happy-post",
    metaTitle: "Imprimer des étiquettes Happy Post sur une feuille A4",
    metaDescription:
      "Optimisez vos étiquettes Happy Post PDF et imprimez jusqu'à 4 bordereaux colis sur une seule feuille A4 pour économiser papier et encre.",
    eyebrow: "Happy Post",
    title: "Imprimer plusieurs étiquettes Happy Post sur une feuille A4",
    intro:
      "Fini le gaspillage : Label2A4 rogne vos étiquettes Happy Post et les place sur une planche A4 x4 prête à imprimer, découper et coller.",
    highlights: ["Happy Post", "4 étiquettes par feuille", "Économie papier"],
    problem: {
      title: "Une étiquette Happy Post peut consommer une feuille entière",
      text:
        "Quand chaque bordereau colis est imprimé seul, vous utilisez plus de papier, plus d'encre et plus de temps de découpe que nécessaire.",
    },
    solution: {
      title: "Une planche A4 optimisée pour vos colis",
      text:
        "Importez vos PDF Happy Post, laissez Label2A4 appliquer le rognage adapté, puis générez un PDF final avec jusqu'à quatre étiquettes sur une seule feuille A4.",
    },
    useCases: [
      {
        title: "Vendeurs réguliers",
        text: "Regroupez plusieurs envois Happy Post du jour dans un seul PDF A4 plus facile à imprimer.",
      },
      {
        title: "Petits lots colis",
        text: "Passez de plusieurs feuilles à une seule planche quand vous préparez deux, trois ou quatre expéditions.",
      },
      {
        title: "Impression maison",
        text: "Gardez votre imprimante A4 habituelle tout en réduisant le gaspillage de papier et d'encre.",
      },
    ],
    economy: {
      title: "Moins de papier, moins d'encre, plus d'efficacité",
      text:
        "Avec quatre étiquettes Happy Post par feuille A4, vous pouvez réduire jusqu'à 75% des feuilles utilisées sur les lots compatibles.",
    },
    steps: [
      "Importez vos PDF Happy Post dans Label2A4.",
      "Sélectionnez le profil Happy Post.",
      "Générez puis imprimez la planche A4 optimisée.",
    ],
    faqs: [
      {
        question: "Comment imprimer plusieurs étiquettes Happy Post sur une feuille A4 ?",
        answer:
          "Importez vos PDF Happy Post dans Label2A4, sélectionnez le profil Happy Post, puis téléchargez le PDF A4 généré avec jusqu'à quatre étiquettes par feuille.",
      },
      {
        question: "Est-ce que le rognage Happy Post est automatique ?",
        answer:
          "Oui. Le profil Happy Post applique un rognage prédéfini et une rotation adaptée par défaut, tout en laissant la possibilité d'ajuster l'orientation si besoin.",
      },
    ],
    ctaLabel: "Optimiser mes étiquettes Happy Post",
  },
  vinted: {
    path: "/vinted",
    metaTitle: "Imprimer des étiquettes Vinted sur une feuille A4",
    metaDescription:
      "Regroupez vos étiquettes Vinted Mondial Relay, Colissimo ou Chronopost sur A4 x4 pour économiser papier et encre.",
    eyebrow: "Vinted",
    title: "Imprimer plusieurs étiquettes Vinted sur une feuille A4",
    intro:
      "Quand plusieurs ventes partent le même jour, Label2A4 vous aide à regrouper les étiquettes Vinted sur une planche A4 plus pratique.",
    highlights: ["Vinted", "Mondial Relay", "Colissimo et Chronopost"],
    problem: {
      title: "Plusieurs ventes, plusieurs feuilles perdues",
      text:
        "Vinted génère des bordereaux transporteurs. Si chaque PDF est imprimé seul, vous consommez rapidement du papier pour des étiquettes qui occupent peu d’espace.",
    },
    solution: {
      title: "Un outil unique pour les transporteurs Vinted",
      text:
        "Sélectionnez le profil adapté au transporteur de votre vente, puis générez une feuille A4 x4 avec vos étiquettes du jour.",
    },
    useCases: [
      {
        title: "Vide-dressing actif",
        text: "Préparez vos ventes groupées plus vite avant le dépôt en relais ou en bureau de poste.",
      },
      {
        title: "Lots du week-end",
        text: "Regroupez les bordereaux téléchargés au fil des ventes dans un PDF final unique.",
      },
      {
        title: "Impression maison",
        text: "Utilisez une imprimante A4 classique sans gaspiller une feuille par colis.",
      },
    ],
    economy: {
      title: "Un format plus rentable pour les vendeurs réguliers",
      text:
        "Dès quatre ventes, vous pouvez passer de quatre feuilles à une feuille A4, selon les fichiers fournis par le transporteur.",
    },
    steps: [
      "Téléchargez vos étiquettes depuis Vinted.",
      "Importez les PDF dans Label2A4.",
      "Choisissez Mondial Relay, Colissimo ou Chronopost selon le bordereau.",
    ],
    faqs: [
      {
        question: "Comment imprimer plusieurs étiquettes Vinted sur une feuille ?",
        answer:
          "Téléchargez les PDF Vinted, importez-les dans Label2A4, choisissez le transporteur et exportez la planche A4 x4.",
      },
      {
        question: "Label2A4 fonctionne-t-il avec Mondial Relay sur Vinted ?",
        answer:
          "Oui. Le profil Mondial Relay est prévu pour préparer ce type d’étiquette sur une feuille A4 optimisée.",
      },
    ],
    ctaLabel: "Regrouper mes étiquettes Vinted",
  },
  leboncoin: {
    path: "/leboncoin",
    metaTitle: "Imprimer des étiquettes Leboncoin sur A4",
    metaDescription:
      "Préparez vos étiquettes d’envoi Leboncoin sur des feuilles A4 x4 avec un outil simple pour PDF transporteurs.",
    eyebrow: "Leboncoin",
    title: "Imprimer des étiquettes Leboncoin sans gaspiller une feuille par colis",
    intro:
      "Les ventes Leboncoin peuvent générer plusieurs bordereaux d’expédition. Label2A4 les regroupe sur A4 pour une impression plus économique.",
    highlights: ["Vente entre particuliers", "PDF transporteurs", "A4 x4"],
    problem: {
      title: "Les bordereaux prennent plus de place que nécessaire",
      text:
        "Une étiquette d’envoi occupe rarement toute une page A4, mais l’impression par défaut utilise souvent une feuille complète.",
    },
    solution: {
      title: "Une sortie compacte pour vos envois Leboncoin",
      text:
        "Importez vos PDF de transporteur, appliquez le rognage adapté, puis récupérez un fichier A4 avec plusieurs étiquettes alignées.",
    },
    useCases: [
      {
        title: "Ventes groupées",
        text: "Imprimez plusieurs bordereaux Leboncoin en une fois avant de préparer les colis.",
      },
      {
        title: "Imprimante familiale",
        text: "Restez sur un format A4 standard tout en réduisant les feuilles consommées.",
      },
      {
        title: "Préparation rapide",
        text: "Gardez un PDF final clair pour vérifier, imprimer et découper.",
      },
    ],
    economy: {
      title: "Moins de feuilles pour les ventes récurrentes",
      text:
        "Si vous vendez régulièrement, les économies de papier s’additionnent vite avec un regroupement quatre par page.",
    },
    steps: [
      "Téléchargez les bordereaux depuis Leboncoin.",
      "Ajoutez les PDF dans Label2A4.",
      "Générez la planche A4 et imprimez-la.",
    ],
    faqs: [
      {
        question: "Comment imprimer une étiquette Leboncoin sur A4 ?",
        answer:
          "Téléchargez le bordereau fourni par Leboncoin, importez le PDF dans Label2A4 et choisissez le profil correspondant au transporteur.",
      },
      {
        question: "Peut-on mélanger plusieurs étiquettes Leboncoin ?",
        answer:
          "Oui, si les PDF sont compatibles avec les profils disponibles ou avec le rognage manuel.",
      },
    ],
    ctaLabel: "Préparer mes étiquettes Leboncoin",
  },
  entreprises: {
    path: "/entreprises",
    metaTitle: "Optimiser l’impression d’étiquettes colis en entreprise",
    metaDescription:
      "Réduisez les coûts d’impression des étiquettes transporteurs avec des planches A4 x4 adaptées aux volumes professionnels.",
    eyebrow: "Entreprises",
    title: "Optimiser l’impression d’étiquettes colis pour les expéditions professionnelles",
    intro:
      "Pour les équipes qui expédient chaque semaine, l’A4 x4 réduit les feuilles imprimées, accélère la préparation et donne un meilleur suivi du coût papier.",
    highlights: ["Économies mesurables", "Volumes réguliers", "Workflow simple"],
    problem: {
      title: "Le coût papier devient invisible mais récurrent",
      text:
        "Une feuille par étiquette semble acceptable à petite échelle. Sur des dizaines ou centaines d’expéditions, le coût papier, encre et manipulation s’installe.",
    },
    solution: {
      title: "Un outil léger, sans changer le transporteur",
      text:
        "Label2A4 intervient après la génération des bordereaux. Vous gardez vos transporteurs et votre process, puis optimisez uniquement le PDF d’impression.",
    },
    useCases: [
      {
        title: "E-commerce",
        text: "Préparez les commandes du jour avec une sortie A4 plus dense.",
      },
      {
        title: "Support et SAV",
        text: "Regroupez les étiquettes de retours ou de remplacements produits.",
      },
      {
        title: "Pics saisonniers",
        text: "Absorbez les lots ponctuels avec un pass ou un accès premium selon le besoin.",
      },
    ],
    economy: {
      title: "Un levier de marge simple à mesurer",
      text:
        "Le simulateur permet d’estimer les feuilles et euros économisés selon votre volume mensuel de colis.",
    },
    steps: [
      "Exportez vos bordereaux transporteurs habituels.",
      "Regroupez les PDF dans Label2A4.",
      "Imprimez la planche optimisée pour la préparation colis.",
    ],
    faqs: [
      {
        question: "Label2A4 convient-il aux expéditions professionnelles ?",
        answer:
          "Oui. L’outil est adapté aux lots réguliers et au besoin d’économiser du papier sans changer de transporteur.",
      },
      {
        question: "Faut-il installer un logiciel ?",
        answer:
          "Non. L’outil fonctionne dans le navigateur avec un export PDF prêt à imprimer.",
      },
    ],
    ctaLabel: "Calculer le gain pour mon volume",
  },
  economies: {
    path: "/economies",
    metaTitle: "Économiser papier et encre sur les étiquettes colis",
    metaDescription:
      "Estimez les économies de papier possibles en imprimant jusqu’à quatre étiquettes transporteurs par feuille A4.",
    eyebrow: "Économies",
    title: "Économiser du papier et de l’argent sur vos impressions d’étiquettes",
    intro:
      "L’impression A4 x4 transforme un petit changement de mise en page en économie récurrente pour les vendeurs et les pros.",
    highlights: ["Jusqu’à 75% de feuilles en moins", "Estimation annuelle", "Moins de gaspillage"],
    problem: {
      title: "Une feuille entière pour une petite étiquette",
      text:
        "Le modèle par défaut gaspille souvent la surface A4. Le coût paraît faible à l’unité, mais il augmente avec le volume.",
    },
    solution: {
      title: "Quatre étiquettes par feuille quand le lot le permet",
      text:
        "En regroupant les étiquettes sur une planche A4, vous réduisez le nombre de feuilles et gardez une sortie PDF lisible.",
    },
    useCases: [
      {
        title: "Particuliers",
        text: "Réduisez les impressions pour les ventes Vinted, Leboncoin et les envois groupés.",
      },
      {
        title: "Professionnels",
        text: "Mesurez un coût récurrent et améliorez la marge sur les volumes mensuels.",
      },
      {
        title: "Organisation",
        text: "Imprimez moins de feuilles, découpez plus vite et classez mieux vos lots.",
      },
    ],
    economy: {
      title: "Une estimation facile à projeter sur 12 mois",
      text:
        "Avec 100 colis par mois, le passage de 100 feuilles à environ 25 feuilles peut économiser près de 900 feuilles par an.",
    },
    steps: [
      "Indiquez votre volume de colis.",
      "Comparez une feuille par étiquette avec l’A4 x4.",
      "Lancez l’outil pour optimiser vos prochains PDF.",
    ],
    faqs: [
      {
        question: "Combien de feuilles peut-on économiser ?",
        answer:
          "Dans le meilleur cas, quatre étiquettes par feuille permettent d’économiser jusqu’à trois feuilles sur quatre.",
      },
      {
        question: "L’économie dépend-elle du transporteur ?",
        answer:
          "Elle dépend surtout du nombre d'étiquettes et du rognage disponible. Label2A4 couvre Chronopost, Colissimo, Mondial Relay, Happy Post et un mode manuel.",
      },
    ],
    ctaLabel: "Estimer mes économies",
  },
} satisfies Record<string, SeoPageContent>

export const seoPageList = Object.values(seoPages)

export function getSeoMetadata(page: SeoPageContent): Metadata {
  const canonical = new URL(page.path, siteConfig.siteUrl).toString()
  const title = `${page.metaTitle} | ${siteConfig.siteName}`
  const image = {
    url: siteConfig.brand.logoPng,
    width: siteConfig.brand.logoWidth,
    height: siteConfig.brand.logoHeight,
    alt: `Logo ${siteConfig.siteName}`,
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url: canonical,
      siteName: siteConfig.siteName,
      title,
      description: page.metaDescription,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.metaDescription,
      images: [siteConfig.brand.logoPng],
    },
  }
}
