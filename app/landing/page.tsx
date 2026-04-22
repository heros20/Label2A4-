import type { Metadata } from "next"
import Link from "next/link"
import { siteConfig } from "@/lib/site-config"

const landingTitle = "Imprimer plusieurs étiquettes PDF sur une feuille A4"
const landingDescription =
  "Guide pratique pour transformer vos étiquettes PDF Chronopost, Colissimo et Mondial Relay en planches A4 x4 prêtes à imprimer."

const landingImage = {
  url: siteConfig.brand.logoPng,
  width: siteConfig.brand.logoWidth,
  height: siteConfig.brand.logoHeight,
  alt: `Logo ${siteConfig.siteName}`,
}

export const metadata: Metadata = {
  title: landingTitle,
  description: landingDescription,
  alternates: {
    canonical: new URL("/landing", siteConfig.siteUrl).toString(),
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: new URL("/landing", siteConfig.siteUrl).toString(),
    siteName: siteConfig.siteName,
    title: `${landingTitle} | ${siteConfig.siteName}`,
    description: landingDescription,
    images: [landingImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${landingTitle} | ${siteConfig.siteName}`,
    description: landingDescription,
    images: [siteConfig.brand.logoPng],
  },
}

const faqs = [
  {
    question: "Comment imprimer une étiquette Mondial Relay sur A4 ?",
    answer:
      "Importez le PDF Mondial Relay dans Label2A4, sélectionnez le profil Mondial Relay, puis téléchargez la planche A4 générée.",
  },
  {
    question: "Comment réduire une étiquette Colissimo ?",
    answer:
      "Le profil Colissimo rogne la zone utile du PDF et replace l’étiquette sur une feuille A4 avec un format plus compact.",
  },
  {
    question: "Peut-on imprimer plusieurs étiquettes sur une feuille ?",
    answer:
      "Oui. Label2A4 compose jusqu’à quatre étiquettes PDF sur une feuille A4, selon le nombre de fichiers importés.",
  },
  {
    question: "Est-ce utile pour Vinted et Leboncoin ?",
    answer:
      "Oui. Les vendeurs Vinted et Leboncoin peuvent regrouper les bordereaux du jour pour réduire les feuilles imprimées.",
  },
] as const

function PaperScene() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-8 right-0 hidden w-[46%] lg:block">
      <div className="absolute right-16 top-3 h-[460px] w-[330px] rotate-3 rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-60px_rgba(15,23,42,0.55)]" />
      <div className="absolute right-28 top-12 grid h-[430px] w-[300px] grid-cols-2 gap-4 rounded-[26px] border border-sky-200 bg-sky-50 p-5 shadow-[0_32px_90px_-58px_rgba(3,105,161,0.55)]">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-sky-200 bg-white p-3">
            <div className="h-2.5 w-3/4 rounded-full bg-sky-200" />
            <div className="mt-3 h-12 rounded-lg bg-slate-950" />
            <div className="mt-3 h-2 w-2/3 rounded-full bg-slate-200" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BeforeAfter() {
  return (
    <section className="mt-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Avant / après</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Du PDF brut au résultat optimisé
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Le fichier transporteur reste votre source. Label2A4 génère un nouveau PDF A4 plus dense pour l’impression.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200/80 bg-white/76 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]">
          <h3 className="text-xl font-semibold text-slate-950">PDF brut</h3>
          <div className="mt-5 aspect-[4/3] rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="h-full rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-1/2 rounded-full bg-slate-300" />
              <div className="mt-5 h-20 rounded-xl bg-slate-950" />
              <div className="mt-5 h-3 w-3/4 rounded-full bg-slate-200" />
              <div className="mt-3 h-3 w-2/3 rounded-full bg-slate-200" />
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-sky-200 bg-sky-50/78 p-5 shadow-[0_24px_60px_-48px_rgba(3,105,161,0.28)]">
          <h3 className="text-xl font-semibold text-slate-950">Résultat A4 x4</h3>
          <div className="mt-5 grid aspect-[4/3] grid-cols-2 gap-4 rounded-[24px] border border-sky-200 bg-white p-5">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl border border-sky-200 bg-sky-50 p-3 shadow-sm">
                <div className="h-2.5 w-2/3 rounded-full bg-sky-200" />
                <div className="mt-3 h-12 rounded-lg bg-slate-950" />
                <div className="mt-3 h-2 w-3/4 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="relative overflow-hidden border-b border-white/70 bg-white/64">
        <PaperScene />
        <div className="relative mx-auto flex w-full max-w-[1200px] flex-col px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            Ouvrir l’outil
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
            Étiquettes PDF en A4 x4
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
            {landingTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{landingDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#outil"
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] transition hover:bg-slate-800"
            >
              Optimiser mes PDF maintenant
            </Link>
            <Link
              href="/economies#simulateur"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
            >
              Estimer mes économies
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">4x</div>
              <p className="mt-1 text-sm text-slate-600">jusqu’à quatre étiquettes par feuille</p>
            </div>
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">75%</div>
              <p className="mt-1 text-sm text-slate-600">de feuilles économisées dans le meilleur cas</p>
            </div>
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">PDF</div>
              <p className="mt-1 text-sm text-slate-600">Chronopost, Colissimo et Mondial Relay</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200/80 bg-white/76 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">Le problème</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">1 étiquette = 1 feuille</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              Les PDF transporteurs sont souvent imprimés seuls. Une petite étiquette utilise alors toute une feuille A4,
              ce qui gaspille du papier, de l’encre et du temps de découpe.
            </p>
          </article>
          <article className="rounded-[28px] border border-sky-200 bg-sky-50/78 p-6 shadow-[0_24px_60px_-48px_rgba(3,105,161,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">La solution</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Un PDF A4 x4 prêt à imprimer</h2>
            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base">
              Label2A4 rogne les étiquettes utiles puis les place sur quatre emplacements A4. Vous gardez vos PDF
              transporteurs et récupérez une sortie optimisée.
            </p>
          </article>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Cas d’usage</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Particuliers, vendeurs réguliers et pros
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Le même outil sert aux ventes ponctuelles et aux lots d’expédition plus importants.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Vinted", "Regroupez les étiquettes des ventes du jour avant le dépôt."],
              ["Leboncoin", "Imprimez plusieurs bordereaux sans consommer une feuille par colis."],
              ["Expéditions massives", "Préparez des lots Chronopost, Colissimo ou Mondial Relay plus compacts."],
              ["Économies", "Réduisez papier, encre et manipulations sur les volumes réguliers."],
            ].map(([title, text]) => (
              <article key={title} className="rounded-[24px] border border-slate-200/80 bg-white/76 p-5">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[28px] border border-emerald-200 bg-emerald-50/78 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.24)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
                Calcul des économies
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Vous voulez chiffrer le gain ?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                Le guide explique la méthode A4 x4. Le calculateur dédié estime les feuilles et euros économisés à
                partir de votre volume de colis mensuel.
              </p>
            </div>
            <Link
              href="/economies#simulateur"
              className="inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Ouvrir le calculateur
            </Link>
          </div>
        </section>

        <BeforeAfter />

        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">FAQ SEO</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Questions fréquentes</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-[24px] border border-slate-200/80 bg-white/76 p-5">
                <h3 className="text-lg font-semibold text-slate-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_28px_70px_-45px_rgba(15,23,42,0.6)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">L’outil est déjà prêt</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Importez vos PDF dans la home existante, choisissez le transporteur, puis téléchargez votre planche A4.
              </p>
            </div>
            <Link
              href="/#outil"
              className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Aller à l’upload
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
