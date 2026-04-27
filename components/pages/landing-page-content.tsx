import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/lib/i18n"
import { localizePath } from "@/lib/i18n"

const LANDING_COMPARISON_IMAGES = [
  {
    key: "before",
    src: "/images/chronopost/leboncoinx1.pdf.jpg",
    frameClassName: "w-full max-w-full shrink-0 aspect-[1755/1240] rotate-270 scale-140",
  },
  {
    key: "after",
    src: "/images/chronopost/leboncoinx4.pdf.jpg",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
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

export function getLandingPageContent(locale: Locale) {
  return locale === "en"
    ? {
        description:
          "A practical guide to print your Chronopost, Colissimo, Mondial Relay and Happy Post shipping labels on a single A4 sheet.",
        faqs: [
          {
            question: "How do I print a Mondial Relay label on A4?",
            answer: "Upload the Mondial Relay PDF to Label2A4, select the Mondial Relay profile, then download the generated A4 sheet.",
          },
          {
            question: "How do I reduce a Colissimo label for A4 printing?",
            answer: "The Colissimo profile isolates the useful PDF area and places the label back on an A4 sheet in a more compact format.",
          },
          {
            question: "Can I print multiple labels on one sheet?",
            answer: "Yes. Label2A4 places up to four PDF labels on one A4 sheet, depending on how many files you upload.",
          },
          {
            question: "Which carriers are supported?",
            answer: "Label2A4 includes profiles for Chronopost, Colissimo, Mondial Relay and Happy Post, plus a manual mode for other PDF formats.",
          },
          {
            question: "Is it useful for Vinted and Leboncoin sellers?",
            answer: "Yes. Vinted and Leboncoin sellers can group the day’s shipping labels to reduce the number of printed sheets.",
          },
        ],
        title: "Stop wasting paper: print 4 labels on one A4 sheet",
      }
    : {
        description:
          "Guide pratique pour imprimer vos étiquettes colis Chronopost, Colissimo, Mondial Relay et Happy Post sur une seule feuille A4.",
        faqs: [
          {
            question: "Comment imprimer une étiquette Mondial Relay sur A4 ?",
            answer: "Importez le PDF Mondial Relay dans Label2A4, sélectionnez le profil Mondial Relay, puis téléchargez la planche A4 générée.",
          },
          {
            question: "Comment réduire une étiquette Colissimo ?",
            answer: "Le profil Colissimo ajuste la zone utile du PDF et replace l’étiquette sur une feuille A4 avec un format plus compact.",
          },
          {
            question: "Peut-on imprimer plusieurs étiquettes sur une feuille ?",
            answer: "Oui. Label2A4 compose jusqu’à quatre étiquettes PDF sur une feuille A4, selon le nombre de fichiers importés.",
          },
          {
            question: "Quels transporteurs sont compatibles ?",
            answer: "Label2A4 propose des profils pour Chronopost, Colissimo, Mondial Relay et Happy Post, avec un mode manuel pour les autres formats PDF.",
          },
          {
            question: "Est-ce utile pour Vinted et Leboncoin ?",
            answer: "Oui. Les vendeurs Vinted et Leboncoin peuvent regrouper les bordereaux du jour pour réduire les feuilles imprimées.",
          },
        ],
        title: "Fini le gaspillage : 4 étiquettes sur une feuille A4",
      }
}

function BeforeAfter({ locale }: { locale: Locale }) {
  return (
    <section className="mt-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
            {locale === "en" ? "Before / after" : "Avant / après"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {locale === "en" ? "From raw PDF to optimized result" : "Du PDF brut au résultat optimisé"}
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          {locale === "en"
            ? "Your carrier PDF remains the source. Label2A4 generates a denser A4 PDF built for printing."
            : "Le fichier transporteur reste votre source. Label2A4 génère un nouveau PDF A4 plus dense pour l’impression."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {LANDING_COMPARISON_IMAGES.map((preview) => {
          const isBefore = preview.key === "before"

          return (
            <article
              key={preview.key}
              className={`rounded-[28px] border p-5 ${
                isBefore
                  ? "border-slate-200/80 bg-white/76 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]"
                  : "border-sky-200 bg-sky-50/78 shadow-[0_24px_60px_-48px_rgba(3,105,161,0.28)]"
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-950">{isBefore ? (locale === "en" ? "Before" : "Avant") : locale === "en" ? "After" : "Après"}</h3>
              <div className={`relative mt-5 aspect-[3/4] overflow-hidden rounded-[24px] border ${isBefore ? "border-slate-200 bg-slate-50" : "border-sky-200 bg-sky-50"}`}>
                <div className="absolute inset-0 flex items-center justify-center p-3">
                  <div className={`relative ${preview.frameClassName}`}>
                    <Image
                      src={preview.src}
                      alt={
                        isBefore
                          ? locale === "en"
                            ? "A single shipping label printed on one sheet"
                            : "Bordereau imprimé seul sur une feuille"
                          : locale === "en"
                            ? "Four shipping labels grouped on one A4 sheet"
                            : "Quatre bordereaux regroupés sur une feuille A4"
                      }
                      fill
                      priority
                      sizes="(min-width: 1024px) 320px, (min-width: 640px) 42vw, 100vw"
                      className="object-contain object-center"
                    />
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function LandingPageContent({ locale }: { locale: Locale }) {
  const landing = getLandingPageContent(locale)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((faq) => ({
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
            href={localizePath("/", locale)}
            className="inline-flex w-fit items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            {locale === "en" ? "Open the tool" : "Ouvrir l’outil"}
          </Link>
          <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
            {locale === "en" ? "PDF labels on A4 x4" : "Étiquettes PDF en A4 x4"}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-[4.25rem] lg:leading-[1.02]">
            {landing.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{landing.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={localizePath("/#outil", locale)}
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] transition hover:bg-slate-800"
            >
              {locale === "en" ? "Optimize my PDFs now" : "Optimiser mes PDF maintenant"}
            </Link>
            <Link
              href={localizePath("/economies#simulateur", locale)}
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
            >
              {locale === "en" ? "Estimate my savings" : "Estimer mes économies"}
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">4x</div>
              <p className="mt-1 text-sm text-slate-600">
                {locale === "en" ? "up to four labels per sheet" : "jusqu’à quatre étiquettes par feuille"}
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">75%</div>
              <p className="mt-1 text-sm text-slate-600">
                {locale === "en" ? "fewer sheets in the best case" : "de feuilles économisées dans le meilleur cas"}
              </p>
            </div>
            <div className="rounded-[22px] border border-slate-200/80 bg-white/82 p-4">
              <div className="text-2xl font-semibold text-slate-950">PDF</div>
              <p className="mt-1 text-sm text-slate-600">
                {locale === "en" ? "Chronopost, Colissimo and Mondial Relay" : "Chronopost, Colissimo et Mondial Relay"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] border border-slate-200/80 bg-white/76 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-800">
              {locale === "en" ? "The problem" : "Le problème"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {locale === "en" ? "1 label = 1 sheet" : "1 étiquette = 1 feuille"}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
              {locale === "en"
                ? "Carrier PDFs are often printed one by one. A small label then uses an entire A4 sheet, which wastes paper, ink and cutting time."
                : "Les PDF transporteurs sont souvent imprimés seuls. Une petite étiquette utilise alors toute une feuille A4, ce qui gaspille du papier, de l’encre et du temps de découpe."}
            </p>
          </article>
          <article className="rounded-[28px] border border-sky-200 bg-sky-50/78 p-6 shadow-[0_24px_60px_-48px_rgba(3,105,161,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
              {locale === "en" ? "The solution" : "La solution"}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {locale === "en" ? "A ready-to-print A4 x4 PDF" : "Un PDF A4 x4 prêt à imprimer"}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base">
              {locale === "en"
                ? "Label2A4 keeps the useful label area and places it on four A4 slots. You keep your carrier PDFs and get an optimized print output."
                : "Label2A4 ajuste les étiquettes utiles puis les place sur quatre emplacements A4. Vous gardez vos PDF transporteurs et récupérez une sortie optimisée."}
            </p>
          </article>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">
                {locale === "en" ? "Use cases" : "Cas d’usage"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {locale === "en" ? "Individuals, regular sellers and businesses" : "Particuliers, vendeurs réguliers et pros"}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              {locale === "en"
                ? "The same tool works for occasional sales and larger recurring shipping batches."
                : "Le même outil sert aux ventes ponctuelles et aux lots d’expédition plus importants."}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(
              locale === "en"
                ? [
                    ["Vinted", "Group the day’s labels before your parcel shop drop-off."],
                    ["Leboncoin", "Print several shipping slips without using one sheet per parcel."],
                    ["Shipping batches", "Prepare more compact Chronopost, Colissimo or Mondial Relay batches."],
                    ["Savings", "Reduce paper, ink and handling on recurring volumes."],
                  ]
                : [
                    ["Vinted", "Regroupez les étiquettes des ventes du jour avant le dépôt."],
                    ["Leboncoin", "Imprimez plusieurs bordereaux sans consommer une feuille par colis."],
                    ["Expéditions massives", "Préparez des lots Chronopost, Colissimo ou Mondial Relay plus compacts."],
                    ["Économies", "Réduisez papier, encre et manipulations sur les volumes réguliers."],
                  ]
            ).map(([title, text]) => (
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
                {locale === "en" ? "Savings calculator" : "Calcul des économies"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {locale === "en" ? "Want to quantify the gain?" : "Vous voulez chiffrer le gain ?"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                {locale === "en"
                  ? "The guide explains the A4 x4 method. The dedicated simulator estimates the sheets and euros saved from your monthly parcel volume."
                  : "Le guide explique la méthode A4 x4. Le calculateur dédié estime les feuilles et euros économisés à partir de votre volume de colis mensuel."}
              </p>
            </div>
            <Link
              href={localizePath("/economies#simulateur", locale)}
              className="inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {locale === "en" ? "Open calculator" : "Ouvrir le calculateur"}
            </Link>
          </div>
        </section>

        <BeforeAfter locale={locale} />

        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">FAQ SEO</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {locale === "en" ? "Frequently asked questions" : "Questions fréquentes"}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {landing.faqs.map((faq) => (
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
              <h2 className="text-2xl font-semibold tracking-tight">
                {locale === "en" ? "The tool is already ready" : "L’outil est déjà prêt"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {locale === "en"
                  ? "Upload your PDFs on the existing home page, choose the carrier, then download your A4 sheet."
                  : "Importez vos PDF dans la home existante, choisissez le transporteur, puis téléchargez votre planche A4."}
              </p>
            </div>
            <Link
              href={localizePath("/#outil", locale)}
              className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              {locale === "en" ? "Go to upload" : "Aller à l’upload"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
