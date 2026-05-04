import type { Metadata } from "next"
import { DEFAULT_LOCALE, getLocaleHrefLang, getOpenGraphLocale, localizePath, type Locale } from "@/lib/i18n"
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

export type SeoPageKey =
  | "mondial-relay"
  | "colissimo"
  | "chronopost"
  | "happy-post"
  | "fedex"
  | "dhl"
  | "vinted"
  | "leboncoin"
  | "entreprises"
  | "economies"

const seoPagesByLocale: Record<Locale, Record<SeoPageKey, SeoPageContent>> = {
  fr: {
    "mondial-relay": {
      path: "/mondial-relay",
      metaTitle: "Imprimer une étiquette Mondial Relay sur A4",
      metaDescription:
        "Regroupez vos étiquettes Mondial Relay PDF sur des feuilles A4 x4 prêtes à imprimer avec Label2A4.",
      eyebrow: "Mondial Relay",
      title: "Imprimer une étiquette Mondial Relay sur une feuille A4",
      intro:
        "Les étiquettes Mondial Relay servent au dépôt en Point Relais, Locker ou agence selon le parcours choisi. Label2A4 ajuste vos PDF Mondial Relay, conserve la zone de scan et les place proprement sur une feuille A4, jusqu’à quatre étiquettes par page.",
      highlights: ["Ajustement Mondial Relay", "Point Relais et Locker", "PDF prêt à imprimer"],
      problem: {
        title: "Un PDF par colis consomme vite trop de papier",
        text:
          "Quand chaque étiquette Mondial Relay est imprimée sur une page entière, trois quarts de la feuille restent inutilisés. Sur plusieurs colis, le gaspillage devient visible, même si Mondial Relay propose aussi l’impression en Point Relais pour certains parcours.",
      },
      solution: {
        title: "Une planche A4 optimisée pour vos dépôts",
        text:
          "Importez vos PDF, choisissez le profil Mondial Relay et la variante adaptée, puis récupérez une planche A4 avec quatre emplacements propres. Vous gardez le rendu transporteur tout en réduisant les impressions à domicile ou au bureau.",
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
          text: "Gardez une méthode simple quand vous avez deux, trois ou quatre colis à déposer en même temps, avec une feuille plus facile à découper.",
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
        "Vérifiez que les codes-barres restent nets, puis téléchargez le PDF A4 x4 prêt pour l’impression.",
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
        {
          question: "Faut-il imprimer l’étiquette Mondial Relay si j’ai un QR code ?",
          answer:
            "Mondial Relay propose l’impression en Point Relais avec un QR code pour certains envois. Si vous avez déjà téléchargé le PDF de l’étiquette, Label2A4 sert à optimiser cette impression sur votre imprimante A4.",
        },
        {
          question: "Comment coller une étiquette Mondial Relay après découpe ?",
          answer:
            "Collez l’étiquette à plat sur une face du colis et évitez de recouvrir le code-barres avec du ruban opaque ou brillant afin de préserver le scan au dépôt.",
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
        "Les étiquettes Colissimo regroupent les informations d’acheminement, le suivi et parfois les documents liés aux envois internationaux. Label2A4 prépare vos PDF Colissimo pour une impression A4 plus compacte, sans refaire votre bordereau ni modifier le contenu transporteur.",
      highlights: ["Profil Colissimo", "Suivi préservé", "Documents douaniers à part"],
      problem: {
        title: "Les bordereaux Colissimo prennent souvent une page entière",
        text:
          "Pour un vendeur régulier, imprimer chaque étiquette seule multiplie les feuilles, le temps de découpe et le coût d’impression. Sur les envois internationaux, il faut aussi garder les documents douaniers requis à portée du colis.",
      },
      solution: {
        title: "Un PDF optimisé avec quatre emplacements",
        text:
          "L’outil ajuste la zone utile de l’étiquette Colissimo puis compose une page A4 avec un placement régulier, plus simple à imprimer et à découper. Les déclarations CN23 ou factures restent à gérer séparément lorsque La Poste les demande.",
      },
      useCases: [
        {
          title: "Ventes entre particuliers",
          text: "Regroupez les envois Colissimo d’une journée sur une sortie plus compacte.",
        },
        {
          title: "Boutiques en ligne",
          text: "Réduisez la consommation de papier quand plusieurs commandes partent avec Colissimo, notamment lors des pics de préparation.",
        },
        {
          title: "Préparation de lots",
          text: "Gardez un PDF final unique pour imprimer, vérifier puis découper vos étiquettes.",
        },
      ],
      economy: {
        title: "Moins de papier sur les volumes réguliers",
        text: "Un lot de 20 étiquettes peut nécessiter environ 5 feuilles au lieu de 20 avec un placement quatre par page.",
      },
      steps: [
        "Ajoutez les PDF Colissimo dans l’ordre voulu.",
        "Choisissez le profil Colissimo.",
        "Vérifiez la lisibilité du code-barres et conservez les documents de douane séparés si l’envoi les exige.",
        "Générez puis téléchargez la planche A4 finale.",
      ],
      faqs: [
        {
          question: "Comment réduire une étiquette Colissimo ?",
          answer:
            "Utilisez le profil Colissimo de Label2A4 pour ajuster la zone utile et replacer l’étiquette sur une feuille A4.",
        },
        {
          question: "Le code-barres Colissimo reste-t-il lisible ?",
          answer:
            "L’objectif est de conserver un rendu net et imprimable. Vérifiez toujours l’aperçu final avant impression, surtout avec un PDF source de faible qualité.",
        },
        {
          question: "Que faire des documents douaniers Colissimo ?",
          answer:
            "Pour certains envois internationaux ou Outre-mer, Colissimo demande des exemplaires CN23 et des factures à placer dans une pochette transparente. Label2A4 optimise l’étiquette, mais ne remplace pas ces documents.",
        },
        {
          question: "Puis-je mélanger plusieurs étiquettes Colissimo ?",
          answer:
            "Oui. Importez plusieurs PDF Colissimo dans le bon ordre, puis générez une planche A4 x4. Contrôlez chaque étiquette avant impression pour éviter d’intervertir les colis.",
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
        "Pour les expéditions rapides et les lots du jour, Label2A4 transforme vos PDF Chronopost en planches A4 plus denses et prêtes à imprimer. Le numéro de colis et les codes de scan restent dans le PDF source, que vous pouvez ensuite suivre sur le module Chronopost.",
      highlights: ["Profil Chronopost", "Suivi colis", "Sortie A4"],
      problem: {
        title: "Les impressions Chronopost s’accumulent vite",
        text:
          "Quand les commandes partent en volume, une feuille par étiquette ajoute du coût, du papier et des manipulations inutiles. Les expéditions express demandent en plus une étiquette nette, lisible et facile à associer au bon colis.",
      },
      solution: {
        title: "Une planche claire pour quatre étiquettes",
        text:
          "Importez vos PDF Chronopost, laissez l’outil appliquer la mise en page adaptée, puis imprimez un PDF final regroupé sur A4. Gardez l’aperçu sous les yeux pour vérifier le numéro de colis avant découpe.",
      },
      useCases: [
        {
          title: "Expéditions express",
          text: "Préparez les envois urgents avec une sortie unique et lisible, utile quand plusieurs colis doivent partir dans la même collecte.",
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
        "Contrôlez le numéro de colis, puis téléchargez la planche A4 prête à imprimer.",
      ],
      faqs: [
        {
          question: "Peut-on regrouper plusieurs étiquettes Chronopost ?",
          answer:
            "Oui. Label2A4 accepte plusieurs PDF et compose une sortie A4 avec jusqu’à quatre étiquettes par feuille.",
        },
        {
          question: "Faut-il modifier le fichier Chronopost original ?",
          answer: "Non. Vous importez le PDF tel quel, puis l’outil génère un nouveau PDF A4 optimisé.",
        },
        {
          question: "Où trouver le numéro de suivi Chronopost ?",
          answer:
            "Chronopost indique que le suivi se fait avec le numéro de colis, souvent composé de 13 caractères pour les envois en France ou de 15 caractères pour certains colis venant de l’étranger.",
        },
        {
          question: "Les documents douaniers Chronopost sont-ils inclus ?",
          answer:
            "Pour les envois internationaux, vérifiez les formalités Chronopost et gardez les documents douaniers demandés avec le colis. Label2A4 optimise la mise en page de l’étiquette, pas le dossier de dédouanement.",
        },
      ],
      ctaLabel: "Optimiser mes étiquettes Chronopost",
    },
    "happy-post": {
      path: "/happy-post",
      metaTitle: "Imprimer des étiquettes Happy Post sur une feuille A4",
      metaDescription:
        "Optimisez vos étiquettes Happy Post PDF et imprimez jusqu’à 4 bordereaux colis sur une seule feuille A4 pour économiser papier et encre.",
      eyebrow: "Happy Post",
      title: "Imprimer plusieurs étiquettes Happy Post sur une feuille A4",
      intro:
        "Fini le gaspillage : Label2A4 ajuste vos étiquettes Happy Post et les place sur une planche A4 x4 prête à imprimer, découper et coller. Le bordereau Happy Post reste associé à son numéro de suivi, que l’expéditeur peut retrouver dans son espace client ou sur l’étiquette.",
      highlights: ["Happy Post", "Suivi sur étiquette", "Économie papier"],
      problem: {
        title: "Une étiquette Happy Post peut consommer une feuille entière",
        text:
          "Quand chaque bordereau colis est imprimé seul, vous utilisez plus de papier, plus d’encre et plus de temps de découpe que nécessaire. Sur les expéditions internationales, certains documents comme CN22 ou CN23 peuvent aussi accompagner l’étiquette.",
      },
      solution: {
        title: "Une planche A4 optimisée pour vos colis",
        text:
          "Importez vos PDF Happy Post, laissez Label2A4 appliquer l’ajustement adapté, puis générez un PDF final avec jusqu’à quatre étiquettes sur une seule feuille A4. Gardez les éventuels documents douaniers séparés lorsque l’envoi les exige.",
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
          text: "Gardez votre imprimante A4 habituelle tout en réduisant le gaspillage de papier et d’encre, sans changer votre parcours Happy Post.",
        },
      ],
      economy: {
        title: "Moins de papier, moins d’encre, plus d’efficacité",
        text:
          "Avec quatre étiquettes Happy Post par feuille A4, vous pouvez réduire jusqu’à 75% des feuilles utilisées sur les lots compatibles.",
      },
      steps: [
        "Importez vos PDF Happy Post dans Label2A4.",
        "Sélectionnez le profil Happy Post.",
        "Vérifiez le numéro de suivi et les codes de scan, puis imprimez la planche A4 optimisée.",
      ],
      faqs: [
        {
          question: "Comment imprimer plusieurs étiquettes Happy Post sur une feuille A4 ?",
          answer:
            "Importez vos PDF Happy Post dans Label2A4, sélectionnez le profil Happy Post, puis téléchargez le PDF A4 généré avec jusqu’à quatre étiquettes par feuille.",
        },
        {
          question: "L’ajustement Happy Post est-il automatique ?",
          answer:
            "Oui. Le profil Happy Post applique un cadrage prédéfini et une rotation adaptée par défaut, tout en laissant la possibilité d’ajuster l’orientation si besoin.",
        },
        {
          question: "Où trouver le suivi Happy Post ?",
          answer:
            "Happy Post indique que le numéro de suivi se trouve dans l’espace client, rubrique Mes commandes, ou sur l’étiquette de transport. Il peut ensuite être saisi sur la page de suivi Happy Post.",
        },
        {
          question: "Que faire si le suivi Happy Post n’apparaît pas tout de suite ?",
          answer:
            "Après un dépôt en point relais, le suivi peut prendre quelques jours à s’activer le temps que le colis soit collecté et scanné. Vérifiez le numéro et conservez l’étiquette lisible.",
        },
      ],
      ctaLabel: "Optimiser mes étiquettes Happy Post",
    },
    fedex: {
      path: "/fedex",
      metaTitle: "Imprimer des étiquettes FedEx sur une feuille A4",
      metaDescription:
        "Regroupez vos étiquettes FedEx PDF sur des planches A4 x4 avec un rognage automatique adapté aux bordereaux FedEx.",
      eyebrow: "FedEx",
      title: "Imprimer plusieurs étiquettes FedEx sur une seule feuille A4",
      intro:
        "Les bordereaux FedEx contiennent les informations d’expédition, le numéro de suivi et les codes-barres nécessaires au scan. Label2A4 isole la zone utile du PDF puis regroupe vos étiquettes FedEx sur une planche A4 prête à imprimer.",
      highlights: ["Profil FedEx", "A4 x4", "Codes-barres préservés"],
      problem: {
        title: "Une étiquette FedEx seule peut occuper toute une page",
        text:
          "Quand vous imprimez chaque PDF FedEx séparément, une grande partie de la feuille A4 peut rester inutilisée, surtout lors des lots e-commerce, retours clients ou expéditions internationales.",
      },
      solution: {
        title: "Un rognage automatique pour une planche plus propre",
        text:
          "Importez vos PDF, choisissez le profil FedEx, puis générez un fichier final avec jusqu’à quatre étiquettes sur la même feuille. Le contenu FedEx reste inchangé : seul le placement d’impression est optimisé.",
      },
      useCases: [
        {
          title: "Expéditions internationales",
          text:
            "Préparez vos étiquettes FedEx avec une sortie compacte tout en gardant vos documents douaniers séparés quand ils sont nécessaires.",
        },
        {
          title: "Retours clients",
          text:
            "Regroupez plusieurs étiquettes de retour FedEx dans un seul PDF A4 avant impression, sans modifier les fichiers source.",
        },
        {
          title: "Lots e-commerce",
          text:
            "Réduisez le nombre de feuilles utilisées lorsque plusieurs commandes partent avec FedEx le même jour.",
        },
      ],
      economy: {
        title: "Jusqu’à quatre étiquettes FedEx par feuille",
        text:
          "Sur les lots compatibles, la mise en page A4 x4 peut diviser la consommation de papier par quatre par rapport à une impression classique, une étiquette par page.",
      },
      steps: [
        "Importez vos PDF FedEx dans Label2A4.",
        "Sélectionnez le profil FedEx dans les transporteurs.",
        "Vérifiez l’aperçu, puis téléchargez la planche A4 x4 prête à imprimer.",
      ],
      faqs: [
        {
          question: "Comment imprimer plusieurs étiquettes FedEx sur une feuille A4 ?",
          answer:
            "Ajoutez vos PDF FedEx dans Label2A4, sélectionnez le profil FedEx, puis exportez le PDF final avec jusqu’à quatre étiquettes par feuille.",
        },
        {
          question: "Le numéro de suivi et les codes-barres FedEx restent-ils lisibles ?",
          answer:
            "Label2A4 ne recrée pas l’étiquette : il rogne et replace le PDF source. Vérifiez toujours l’aperçu final et imprimez avec une qualité suffisante pour que les codes-barres restent scannables.",
        },
        {
          question: "Que faire pour les documents de douane FedEx ?",
          answer:
            "Gardez les documents douaniers ou factures commerciales avec l’envoi lorsque FedEx les demande. La planche Label2A4 optimise l’impression des étiquettes, pas les obligations documentaires du transporteur.",
        },
      ],
      ctaLabel: "Optimiser mes étiquettes FedEx",
    },
    dhl: {
      path: "/dhl",
      metaTitle: "Imprimer des étiquettes DHL sur une feuille A4",
      metaDescription:
        "Optimisez vos étiquettes DHL PDF et imprimez plusieurs bordereaux sur une planche A4 x4 avec un profil de rognage dédié.",
      eyebrow: "DHL",
      title: "Imprimer plusieurs étiquettes DHL sur une seule feuille A4",
      intro:
        "Les expéditions DHL doivent disposer d’un bordereau rempli et d’une étiquette solidement fixée au colis. Label2A4 isole la zone utile de vos PDF DHL, conserve les éléments de suivi et de scan, puis les regroupe sur une planche A4 prête à imprimer.",
      highlights: ["Profil DHL", "Suivi préservé", "Documents douaniers à part"],
      problem: {
        title: "Une étiquette DHL seule peut gaspiller une feuille entière",
        text:
          "Quand chaque bordereau DHL est imprimé seul, une grande partie de la feuille A4 peut rester inutilisée. Sur des lots e-commerce, retours ou expéditions internationales, cela augmente vite le papier, l’encre et le temps de découpe.",
      },
      solution: {
        title: "Un rognage DHL automatique pour une planche claire",
        text:
          "Importez vos PDF, choisissez le profil DHL, puis générez un fichier final avec jusqu’à quatre étiquettes sur la même feuille. Le contenu transporteur reste inchangé : Label2A4 optimise seulement la zone imprimée et le placement.",
      },
      useCases: [
        {
          title: "Expéditions express",
          text:
            "Préparez les bordereaux DHL du jour avec une sortie compacte, pratique avant enlèvement, dépôt en agence ou préparation de commandes.",
        },
        {
          title: "Lots e-commerce",
          text:
            "Regroupez plusieurs étiquettes DHL dans un seul PDF A4 pour réduire les impressions répétées lors des pics de commandes.",
        },
        {
          title: "International et douane",
          text:
            "Gardez les factures commerciales ou pro forma demandées par DHL séparées de la planche d’étiquettes lorsque l’envoi les exige.",
        },
      ],
      economy: {
        title: "Jusqu’à quatre étiquettes DHL par feuille",
        text:
          "Sur les lots compatibles, une planche A4 x4 peut réduire fortement la consommation de papier par rapport à une impression classique, une étiquette par page.",
      },
      steps: [
        "Importez vos PDF DHL dans Label2A4.",
        "Sélectionnez le profil DHL dans les transporteurs.",
        "Vérifiez que le suivi et les codes-barres restent nets, puis téléchargez la planche A4 x4.",
      ],
      faqs: [
        {
          question: "Comment imprimer plusieurs étiquettes DHL sur une feuille A4 ?",
          answer:
            "Ajoutez vos PDF DHL, sélectionnez le profil DHL, vérifiez l’aperçu puis exportez le PDF final avec jusqu’à quatre étiquettes par feuille.",
        },
        {
          question: "Les codes-barres et le suivi DHL restent-ils lisibles ?",
          answer:
            "Label2A4 ne recrée pas l’étiquette : il rogne et replace le PDF source. Vérifiez toujours l’aperçu final et imprimez avec une qualité suffisante pour que les codes de scan restent lisibles.",
        },
        {
          question: "Faut-il ajouter des documents douaniers avec DHL ?",
          answer:
            "Pour les marchandises et certains envois internationaux, DHL indique qu’une facture commerciale ou pro forma et d’autres documents peuvent être nécessaires. Label2A4 optimise l’étiquette, pas les obligations douanières.",
        },
        {
          question: "Quand le suivi DHL apparaît-il ?",
          answer:
            "DHL indique que les événements de suivi peuvent apparaître 24 à 48 heures après la réception de l’identifiant Track and Trace. Conservez le numéro visible sur l’étiquette.",
        },
      ],
      ctaLabel: "Optimiser mes étiquettes DHL",
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
          "Importez vos PDF de transporteur, appliquez la mise en page adaptée, puis récupérez un fichier A4 avec plusieurs étiquettes alignées.",
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
          answer: "Oui, si les PDF sont compatibles avec les profils disponibles ou avec le mode manuel.",
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
          answer: "Non. L’outil fonctionne dans le navigateur avec un export PDF prêt à imprimer.",
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
            "Elle dépend surtout du nombre d’étiquettes et du cadrage disponible. Label2A4 couvre Chronopost, Colissimo, Mondial Relay, Happy Post et un mode manuel.",
        },
      ],
      ctaLabel: "Estimer mes économies",
    },
  },
  en: {
    "mondial-relay": {
      path: "/mondial-relay",
      metaTitle: "Print Mondial Relay shipping labels on A4",
      metaDescription:
        "Place your Mondial Relay PDF shipping labels on A4 x4 sheets with automatic carrier layout and less paper waste.",
      eyebrow: "Mondial Relay",
      title: "Print Mondial Relay shipping labels on one A4 sheet",
      intro:
        "Mondial Relay labels are used for drop-off in Point Relais, lockers or agencies depending on the selected route. Label2A4 keeps the scannable label area intact and places your PDFs neatly on an A4 sheet, with up to four labels per page.",
      highlights: ["Automatic carrier layout", "Point Relais and lockers", "Ready-to-print PDF"],
      problem: {
        title: "One PDF per parcel wastes paper fast",
        text:
          "When each Mondial Relay label is printed on a full page, most of the A4 sheet stays empty. With multiple parcels, the waste becomes very visible, even though some Mondial Relay routes can also be printed in a relay point.",
      },
      solution: {
        title: "A cleaner A4 sheet for your daily drop-offs",
        text:
          "Upload your PDFs, select the Mondial Relay profile and matching variant, then export one clean A4 sheet with four label slots. You keep the carrier format while printing fewer pages at home or at the office.",
      },
      useCases: [
        {
          title: "Vinted sellers",
          text: "Prepare several sales from the day without launching a full print for every single label.",
        },
        {
          title: "Small online shops",
          text: "Handle recurring Mondial Relay batches with fewer sheets and an output that is easier to cut.",
        },
        {
          title: "Occasional shipments",
          text: "Keep a simple workflow when you need to drop off two, three or four parcels at once, with a sheet that is easier to cut.",
        },
      ],
      economy: {
        title: "Up to 75% fewer sheets",
        text:
          "With four labels on one A4 sheet, a batch of 40 parcels can go from 40 sheets down to around 10, depending on the total number of labels.",
      },
      steps: [
        "Upload your Mondial Relay PDFs.",
        "Select the Mondial Relay profile and the matching variant.",
        "Check that the barcodes stay sharp, then download the ready-to-print A4 x4 PDF.",
      ],
      faqs: [
        {
          question: "How do I print a Mondial Relay label on A4?",
          answer:
            "Upload the Mondial Relay PDF to Label2A4, choose the Mondial Relay profile, then export the generated A4 sheet.",
        },
        {
          question: "Can I place multiple Mondial Relay labels on one page?",
          answer: "Yes. The tool groups up to four labels on one A4 sheet, depending on how many PDFs you upload.",
        },
        {
          question: "Do I need to print a Mondial Relay label if I have a QR code?",
          answer:
            "Mondial Relay offers relay-point printing with a QR code for some shipments. If you already downloaded the label PDF, Label2A4 helps optimize that PDF for your own A4 printer.",
        },
        {
          question: "How should I attach a Mondial Relay label after cutting it?",
          answer:
            "Attach the label flat on one side of the parcel and avoid covering the barcode with opaque or glossy tape so it can still be scanned at drop-off.",
        },
      ],
      ctaLabel: "Optimize my Mondial Relay labels",
    },
    colissimo: {
      path: "/colissimo",
      metaTitle: "Print Colissimo shipping labels on A4",
      metaDescription:
        "Convert your Colissimo PDF labels into compact A4 x4 sheets to save paper and print more efficiently.",
      eyebrow: "Colissimo",
      title: "Print Colissimo shipping labels on a compact A4 layout",
      intro:
        "Colissimo labels include routing information, tracking details and, for some international shipments, related customs paperwork. Label2A4 prepares your Colissimo PDFs for a cleaner A4 print workflow without recreating the label or changing carrier content.",
      highlights: ["Colissimo profile", "Tracking preserved", "Customs documents aside"],
      problem: {
        title: "Colissimo labels often take a full page",
        text:
          "For regular sellers, printing each label on its own sheet multiplies paper usage, cutting time and printing costs. For international shipments, you may also need to keep the required customs documents with the parcel.",
      },
      solution: {
        title: "One optimized PDF with four slots",
        text:
          "The tool isolates the useful Colissimo label area, then creates a consistent A4 sheet that is easier to print and cut. CN23 declarations or invoices should still be handled separately when La Poste requires them.",
      },
      useCases: [
        {
          title: "Peer-to-peer sales",
          text: "Group the day’s Colissimo shipments into a more compact print output.",
        },
        {
          title: "Online stores",
          text: "Reduce paper usage when several orders are sent with Colissimo, especially during packing peaks.",
        },
        {
          title: "Batch preparation",
          text: "Keep one final PDF to review, print and cut your labels.",
        },
      ],
      economy: {
        title: "Less paper for recurring shipping volumes",
        text: "A batch of 20 labels can require around 5 sheets instead of 20 with a four-up A4 layout.",
      },
      steps: [
        "Add your Colissimo PDFs in the order you want.",
        "Choose the Colissimo profile.",
        "Check barcode readability and keep customs documents separate if the shipment requires them.",
        "Generate and download the final A4 sheet.",
      ],
      faqs: [
        {
          question: "How do I reduce a Colissimo label for A4 printing?",
          answer:
            "Use the Colissimo profile in Label2A4 to isolate the useful area and place the label on an A4 sheet automatically.",
        },
        {
          question: "Will the Colissimo barcode stay readable?",
          answer:
            "The goal is to keep the output sharp and printable. Always check the final preview before printing, especially when the source PDF quality is low.",
        },
        {
          question: "What should I do with Colissimo customs documents?",
          answer:
            "For some international or overseas shipments, Colissimo asks for CN23 copies and invoices in a transparent pouch. Label2A4 optimizes the label, but it does not replace these documents.",
        },
        {
          question: "Can I mix several Colissimo labels?",
          answer:
            "Yes. Import several Colissimo PDFs in the right order, then generate an A4 x4 sheet. Check each label before printing to avoid mixing parcels.",
        },
      ],
      ctaLabel: "Prepare my Colissimo labels",
    },
    chronopost: {
      path: "/chronopost",
      metaTitle: "Print multiple Chronopost labels on A4",
      metaDescription:
        "Place your Chronopost PDF shipping labels on A4 x4 sheets to print less and prepare shipments faster.",
      eyebrow: "Chronopost",
      title: "Print multiple Chronopost shipping labels on one A4 sheet",
      intro:
        "For urgent shipments and daily batches, Label2A4 turns your Chronopost PDFs into denser A4 sheets that are ready to print. The parcel number and scannable codes remain in the source PDF, ready to check later through Chronopost tracking.",
      highlights: ["Chronopost profile", "Parcel tracking", "A4 output"],
      problem: {
        title: "Chronopost prints stack up quickly",
        text:
          "When orders go out in volume, one sheet per label adds avoidable cost, paper waste and extra handling. Express shipments also need a clean, readable label that is easy to match with the right parcel.",
      },
      solution: {
        title: "One clear sheet for four labels",
        text:
          "Upload your Chronopost PDFs, let the tool apply the right carrier layout automatically, then print one final grouped A4 PDF. Keep the preview visible so you can check the parcel number before cutting.",
      },
      useCases: [
        {
          title: "Express shipments",
          text: "Prepare urgent orders with a single clean output, useful when several parcels leave in the same pickup.",
        },
        {
          title: "Commercial campaigns",
          text: "Reduce printing during order spikes or short-term sales pushes.",
        },
        {
          title: "E-commerce back office",
          text: "Simplify batch preparation without changing your carrier or source PDF workflow.",
        },
      ],
      economy: {
        title: "A real gain from the first batches",
        text: "Even with a few dozen labels per month, moving to A4 x4 can cut the number of printed sheets dramatically.",
      },
      steps: [
        "Drop in your Chronopost PDFs.",
        "Select the Chronopost profile.",
        "Check the parcel number, then download the ready-to-print A4 sheet.",
      ],
      faqs: [
        {
          question: "Can I group several Chronopost labels together?",
          answer: "Yes. Label2A4 accepts multiple PDFs and creates an A4 output with up to four labels per sheet.",
        },
        {
          question: "Do I need to modify the original Chronopost PDF?",
          answer: "No. You upload the PDF as it is, and the tool generates a new optimized A4 PDF.",
        },
        {
          question: "Where can I find the Chronopost tracking number?",
          answer:
            "Chronopost says tracking uses the parcel number, often 13 characters for shipments in France or 15 characters for some parcels coming from abroad.",
        },
        {
          question: "Are Chronopost customs documents included?",
          answer:
            "For international shipments, check Chronopost customs requirements and keep any required documents with the parcel. Label2A4 optimizes label layout, not the customs file.",
        },
      ],
      ctaLabel: "Optimize my Chronopost labels",
    },
    "happy-post": {
      path: "/happy-post",
      metaTitle: "Print Happy Post labels on one A4 sheet",
      metaDescription:
        "Optimize your Happy Post PDF shipping labels and print up to 4 labels on one A4 sheet to save paper and ink.",
      eyebrow: "Happy Post",
      title: "Print multiple Happy Post labels on one A4 sheet",
      intro:
        "Stop wasting paper: Label2A4 automatically adjusts your Happy Post labels and places them on a ready-to-print A4 x4 sheet. The Happy Post waybill remains linked to its tracking number, which can be found in the customer account or on the label.",
      highlights: ["Happy Post", "Tracking on label", "Paper savings"],
      problem: {
        title: "A single Happy Post label can use a full sheet",
        text:
          "When each shipping label is printed alone, you use more paper, more ink and more cutting time than necessary. International shipments may also include documents such as CN22 or CN23 forms.",
      },
      solution: {
        title: "An optimized A4 sheet for your parcels",
        text:
          "Upload your Happy Post PDFs, let Label2A4 apply the right automatic adjustment, then generate a final PDF with up to four labels on one A4 sheet. Keep any customs documents separate when the shipment requires them.",
      },
      useCases: [
        {
          title: "Frequent sellers",
          text: "Group several Happy Post shipments from the day into a single A4 PDF that is easier to print.",
        },
        {
          title: "Small parcel batches",
          text: "Move from several sheets to one A4 board when you prepare two, three or four shipments.",
        },
        {
          title: "Home printing",
          text: "Keep using a standard A4 printer while reducing paper and ink waste, without changing your Happy Post workflow.",
        },
      ],
      economy: {
        title: "Less paper, less ink, more efficiency",
        text: "With four Happy Post labels on one A4 sheet, you can cut up to 75% of the sheets used on compatible batches.",
      },
      steps: [
        "Upload your Happy Post PDFs.",
        "Select the Happy Post profile.",
        "Check the tracking number and scannable codes, then print the optimized A4 sheet.",
      ],
      faqs: [
        {
          question: "How do I print several Happy Post labels on one A4 sheet?",
          answer:
            "Upload your Happy Post PDFs to Label2A4, choose the Happy Post profile, then download the generated A4 PDF with up to four labels per sheet.",
        },
        {
          question: "Is the Happy Post layout applied automatically?",
          answer:
            "Yes. The Happy Post profile applies a predefined adjustment and rotation by default, while still letting you tweak the orientation if needed.",
        },
        {
          question: "Where can I find Happy Post tracking?",
          answer:
            "Happy Post says the tracking number is available in the customer account, under orders, or on the transport label. It can then be entered on the Happy Post tracking page.",
        },
        {
          question: "What if Happy Post tracking does not appear immediately?",
          answer:
            "After drop-off at a relay point, tracking can take a few days to activate while the parcel is collected and scanned. Check the number and keep the label readable.",
        },
      ],
      ctaLabel: "Optimize my Happy Post labels",
    },
    fedex: {
      path: "/fedex",
      metaTitle: "Print FedEx shipping labels on A4",
      metaDescription:
        "Group FedEx PDF shipping labels on A4 x4 sheets with an automatic crop profile designed for FedEx labels.",
      eyebrow: "FedEx",
      title: "Print multiple FedEx shipping labels on one A4 sheet",
      intro:
        "FedEx labels include the shipment details, tracking number and scannable barcodes needed for handling. Label2A4 isolates the useful area of the PDF and groups your FedEx labels on a ready-to-print A4 sheet.",
      highlights: ["FedEx profile", "A4 x4", "Barcodes preserved"],
      problem: {
        title: "A single FedEx label can take a whole page",
        text:
          "Printing each FedEx PDF separately can leave most of the A4 sheet unused, especially for e-commerce batches, customer returns or international shipments.",
      },
      solution: {
        title: "Automatic cropping for a cleaner print sheet",
        text:
          "Upload your PDFs, choose the FedEx profile, then generate a final file with up to four labels on the same sheet. The FedEx content stays unchanged; only the print layout is optimized.",
      },
      useCases: [
        {
          title: "International shipments",
          text:
            "Prepare FedEx labels in a compact output while keeping customs documents separate whenever they are required.",
        },
        {
          title: "Customer returns",
          text: "Group several FedEx return labels into one A4 PDF before printing, without changing the source files.",
        },
        {
          title: "E-commerce batches",
          text: "Use fewer sheets when several orders ship with FedEx on the same day.",
        },
      ],
      economy: {
        title: "Up to four FedEx labels per sheet",
        text:
          "For compatible batches, the A4 x4 layout can reduce paper usage by up to four times compared with printing one label per page.",
      },
      steps: [
        "Upload your FedEx PDFs to Label2A4.",
        "Select the FedEx carrier profile.",
        "Check the preview, then download the ready-to-print A4 x4 sheet.",
      ],
      faqs: [
        {
          question: "How do I print several FedEx labels on one A4 sheet?",
          answer:
            "Add your FedEx PDFs to Label2A4, select the FedEx profile, then export the final PDF with up to four labels per sheet.",
        },
        {
          question: "Will the FedEx tracking number and barcodes stay readable?",
          answer:
            "Label2A4 does not recreate the label; it crops and places the source PDF. Always check the final preview and print with enough quality for barcodes to remain scannable.",
        },
        {
          question: "What about FedEx customs documents?",
          answer:
            "Keep any customs documents or commercial invoices with the shipment when FedEx requires them. The Label2A4 sheet optimizes label printing, not carrier documentation requirements.",
        },
      ],
      ctaLabel: "Optimize my FedEx labels",
    },
    dhl: {
      path: "/dhl",
      metaTitle: "Print DHL shipping labels on A4",
      metaDescription:
        "Optimize DHL PDF shipping labels and print several waybills on one A4 x4 sheet with a dedicated carrier crop profile.",
      eyebrow: "DHL",
      title: "Print multiple DHL shipping labels on one A4 sheet",
      intro:
        "DHL shipments need a completed waybill and a shipping label securely attached to the parcel. Label2A4 isolates the useful area of your DHL PDFs, keeps tracking and scannable elements intact, then groups them on a ready-to-print A4 sheet.",
      highlights: ["DHL profile", "Tracking preserved", "Customs documents aside"],
      problem: {
        title: "A single DHL label can waste a whole sheet",
        text:
          "Printing each DHL waybill on its own can leave much of the A4 sheet unused. For e-commerce batches, returns or international shipments, paper, ink and cutting time add up quickly.",
      },
      solution: {
        title: "Automatic DHL cropping for a cleaner sheet",
        text:
          "Upload your PDFs, choose the DHL profile, then generate a final file with up to four labels on the same sheet. The carrier content stays unchanged: Label2A4 only optimizes the printed area and placement.",
      },
      useCases: [
        {
          title: "Express shipments",
          text:
            "Prepare the day’s DHL waybills in a compact output before pickup, agency drop-off or order packing.",
        },
        {
          title: "E-commerce batches",
          text: "Group several DHL labels into one A4 PDF to reduce repeated printing during order peaks.",
        },
        {
          title: "International and customs",
          text:
            "Keep any commercial or pro forma invoices required by DHL separate from the label sheet when the shipment needs them.",
        },
      ],
      economy: {
        title: "Up to four DHL labels per sheet",
        text:
          "For compatible batches, an A4 x4 sheet can greatly reduce paper use compared with printing one label per page.",
      },
      steps: [
        "Upload your DHL PDFs to Label2A4.",
        "Select the DHL carrier profile.",
        "Check that tracking and barcodes stay sharp, then download the A4 x4 sheet.",
      ],
      faqs: [
        {
          question: "How do I print several DHL labels on one A4 sheet?",
          answer:
            "Add your DHL PDFs, select the DHL profile, check the preview, then export the final PDF with up to four labels per sheet.",
        },
        {
          question: "Will DHL barcodes and tracking stay readable?",
          answer:
            "Label2A4 does not recreate the label; it crops and places the source PDF. Always check the final preview and print with enough quality for scan codes to remain readable.",
        },
        {
          question: "Do I need customs documents with DHL?",
          answer:
            "For goods and some international shipments, DHL says a commercial or pro forma invoice and other documents may be required. Label2A4 optimizes the label, not customs obligations.",
        },
        {
          question: "When does DHL tracking appear?",
          answer:
            "DHL says tracking events may appear 24 to 48 hours after receiving the Track and Trace ID. Keep the number visible on the label.",
        },
      ],
      ctaLabel: "Optimize my DHL labels",
    },
    vinted: {
      path: "/vinted",
      metaTitle: "Print Vinted shipping labels on one A4 sheet",
      metaDescription:
        "Group your Vinted Mondial Relay, Colissimo or Chronopost labels on A4 x4 sheets to save paper and ink.",
      eyebrow: "Vinted",
      title: "Print multiple Vinted labels on one A4 sheet",
      intro:
        "When several sales ship the same day, Label2A4 helps you group your Vinted labels on a more practical A4 sheet.",
      highlights: ["Vinted", "Mondial Relay", "Colissimo and Chronopost"],
      problem: {
        title: "Several sales, several wasted sheets",
        text:
          "Vinted generates carrier labels. If every PDF is printed on its own, you quickly use too much paper for labels that occupy only a small part of the page.",
      },
      solution: {
        title: "One tool for Vinted carrier labels",
        text:
          "Choose the carrier profile that matches your sale, then generate one A4 x4 sheet with all of the day’s labels.",
      },
      useCases: [
        {
          title: "Active closet sellers",
          text: "Prepare grouped sales faster before dropping them off at a parcel shop or post office.",
        },
        {
          title: "Weekend batches",
          text: "Group labels downloaded throughout the weekend into one final PDF.",
        },
        {
          title: "Home printing",
          text: "Use a standard A4 printer without wasting one sheet per parcel.",
        },
      ],
      economy: {
        title: "A more efficient format for regular sellers",
        text: "From four sales onward, you can go from four sheets to one A4 sheet, depending on the carrier PDFs provided.",
      },
      steps: [
        "Download your labels from Vinted.",
        "Upload the PDFs to Label2A4.",
        "Choose Mondial Relay, Colissimo or Chronopost depending on the label.",
      ],
      faqs: [
        {
          question: "How do I print multiple Vinted labels on one sheet?",
          answer:
            "Download the Vinted PDFs, upload them to Label2A4, choose the carrier, then export the A4 x4 sheet.",
        },
        {
          question: "Does Label2A4 work with Mondial Relay labels from Vinted?",
          answer:
            "Yes. The Mondial Relay profile is designed for this type of shipping label and produces an optimized A4 output.",
        },
      ],
      ctaLabel: "Group my Vinted labels",
    },
    leboncoin: {
      path: "/leboncoin",
      metaTitle: "Print Leboncoin shipping labels on A4",
      metaDescription:
        "Prepare your Leboncoin shipping labels on compact A4 x4 sheets with a simple tool for carrier PDFs.",
      eyebrow: "Leboncoin",
      title: "Print Leboncoin labels without wasting one sheet per parcel",
      intro:
        "Leboncoin sales can generate several shipping slips. Label2A4 groups them onto A4 sheets for a more efficient print workflow.",
      highlights: ["Peer-to-peer sales", "Carrier PDFs", "A4 x4"],
      problem: {
        title: "Shipping slips take more space than they should",
        text:
          "A shipping label rarely needs a full A4 page, yet the default print often uses an entire sheet.",
      },
      solution: {
        title: "A compact output for your Leboncoin shipments",
        text:
          "Upload your carrier PDFs, apply the right layout automatically, then export one A4 file with several aligned labels.",
      },
      useCases: [
        {
          title: "Grouped sales",
          text: "Print several Leboncoin labels at once before packing your parcels.",
        },
        {
          title: "Family printer",
          text: "Stay on a standard A4 format while reducing the number of sheets used.",
        },
        {
          title: "Fast preparation",
          text: "Keep one clear final PDF to review, print and cut.",
        },
      ],
      economy: {
        title: "Fewer sheets for recurring sales",
        text: "If you sell regularly, paper savings add up quickly with a four-up layout.",
      },
      steps: [
        "Download your Leboncoin shipping slips.",
        "Add the PDFs to Label2A4.",
        "Generate the A4 sheet and print it.",
      ],
      faqs: [
        {
          question: "How do I print a Leboncoin shipping label on A4?",
          answer:
            "Download the shipping PDF from Leboncoin, upload it to Label2A4, then choose the profile that matches the carrier.",
        },
        {
          question: "Can I mix several Leboncoin labels together?",
          answer: "Yes, as long as the PDFs match the available carrier profiles or the manual mode.",
        },
      ],
      ctaLabel: "Prepare my Leboncoin labels",
    },
    entreprises: {
      path: "/entreprises",
      metaTitle: "Optimize shipping label printing for businesses",
      metaDescription:
        "Reduce carrier label printing costs with A4 x4 sheets designed for business shipping volumes.",
      eyebrow: "Business",
      title: "Optimize shipping label printing for professional fulfillment",
      intro:
        "For teams shipping every week, the A4 x4 format reduces printed sheets, speeds up preparation and makes paper cost easier to track.",
      highlights: ["Measurable savings", "Recurring volumes", "Simple workflow"],
      problem: {
        title: "Paper cost is easy to ignore, but it keeps coming back",
        text:
          "One sheet per label feels acceptable at small scale. Over dozens or hundreds of shipments, paper, ink and handling become a real recurring cost.",
      },
      solution: {
        title: "A lightweight tool that keeps your carrier workflow intact",
        text:
          "Label2A4 steps in after your labels are generated. You keep your carriers and your process, and only optimize the print PDF.",
      },
      useCases: [
        {
          title: "E-commerce",
          text: "Prepare the day’s orders with a denser A4 output.",
        },
        {
          title: "Support and returns",
          text: "Group return labels or replacement shipments on the same optimized print sheet.",
        },
        {
          title: "Seasonal spikes",
          text: "Absorb temporary batches with a day pass or premium access depending on your needs.",
        },
      ],
      economy: {
        title: "A simple margin lever you can measure",
        text: "The simulator estimates sheets and euros saved based on your monthly parcel volume.",
      },
      steps: [
        "Export your usual carrier labels.",
        "Group the PDFs in Label2A4.",
        "Print the optimized sheet for fulfillment prep.",
      ],
      faqs: [
        {
          question: "Is Label2A4 suitable for business shipping?",
          answer:
            "Yes. The tool is built for recurring batches and for teams that want to save paper without changing carriers.",
        },
        {
          question: "Do I need to install any software?",
          answer: "No. The tool runs in the browser and exports a ready-to-print PDF.",
        },
      ],
      ctaLabel: "Estimate the gain for my volume",
    },
    economies: {
      path: "/economies",
      metaTitle: "Save paper and ink on shipping labels",
      metaDescription:
        "Estimate how much paper you can save by printing up to four carrier shipping labels on one A4 sheet.",
      eyebrow: "Savings",
      title: "Save paper and money on shipping label printing",
      intro:
        "A4 x4 printing turns a small layout change into a recurring saving for both occasional sellers and professional teams.",
      highlights: ["Up to 75% fewer sheets", "Annual estimate", "Lower waste"],
      problem: {
        title: "A full sheet for a small label",
        text:
          "The default print layout often wastes most of the A4 surface. The unit cost looks small, but it grows with volume.",
      },
      solution: {
        title: "Four labels per sheet when the batch allows it",
        text:
          "By grouping labels on one A4 sheet, you reduce the number of sheets while keeping a final PDF that stays easy to read and print.",
      },
      useCases: [
        {
          title: "Individuals",
          text: "Reduce printing for Vinted sales, Leboncoin orders and grouped shipments.",
        },
        {
          title: "Businesses",
          text: "Track a recurring cost and improve margin on monthly shipping volumes.",
        },
        {
          title: "Operations",
          text: "Print fewer sheets, cut faster and organize batches more cleanly.",
        },
      ],
      economy: {
        title: "An estimate you can project over 12 months",
        text:
          "With 100 parcels per month, moving from 100 sheets to around 25 can save close to 900 sheets per year.",
      },
      steps: [
        "Enter your parcel volume.",
        "Compare one sheet per label with the A4 x4 layout.",
        "Launch the tool to optimize your next PDFs.",
      ],
      faqs: [
        {
          question: "How many sheets can I save?",
          answer:
            "In the best case, four labels per sheet lets you save up to three sheets out of four.",
        },
        {
          question: "Do savings depend on the carrier?",
          answer:
            "They depend mostly on the number of labels and the available layout profile. Label2A4 covers Chronopost, Colissimo, Mondial Relay, Happy Post and a manual mode.",
        },
      ],
      ctaLabel: "Estimate my savings",
    },
  },
}

export function getSeoPage(pageKey: SeoPageKey, locale: Locale = DEFAULT_LOCALE) {
  return seoPagesByLocale[locale][pageKey]
}

export const seoPageList = Object.values(seoPagesByLocale[DEFAULT_LOCALE])

function absoluteUrl(path: string) {
  return new URL(path, siteConfig.siteUrl).toString()
}

export function getSeoMetadata(page: SeoPageContent, locale: Locale = DEFAULT_LOCALE): Metadata {
  const localizedPath = localizePath(page.path, locale)
  const canonical = absoluteUrl(localizedPath)
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
      languages: {
        [getLocaleHrefLang("fr")]: absoluteUrl(localizePath(page.path, "fr")),
        [getLocaleHrefLang("en")]: absoluteUrl(localizePath(page.path, "en")),
      },
    },
    openGraph: {
      type: "article",
      locale: getOpenGraphLocale(locale),
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
