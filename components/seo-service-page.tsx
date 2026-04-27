import Image from "next/image"
import Link from "next/link"
import type { SeoPageContent } from "@/lib/seo-pages"

const SEO_PAGE_LOGOS: Record<string, { src: string; alt: string }> = {
  "/chronopost": {
    src: "/images/logo/chronopost.png",
    alt: "Logo Chronopost",
  },
  "/colissimo": {
    src: "/images/logo/colissimo.png",
    alt: "Logo Colissimo",
  },
  "/happy-post": {
    src: "/images/logo/happy-post.png",
    alt: "Logo Happy Post",
  },
  "/mondial-relay": {
    src: "/images/logo/mondial-relais.png",
    alt: "Logo Mondial Relay",
  },
  "/vinted": {
    src: "/images/logo/vinted.jpg",
    alt: "Logo Vinted",
  },
  "/leboncoin": {
    src: "/images/logo/leboncoin.png",
    alt: "Logo Leboncoin",
  },
}

const CHRONOPOST_COMPARISON_IMAGES = [
  {
    label: "Avant",
    labelClassName: "text-slate-600",
    panelClassName: "border-slate-200 bg-slate-50",
    src: "/images/chronopost/leboncoinx1.pdf.jpg",
    alt: "Bordereau Chronopost imprimé seul sur une feuille",
    frameClassName: "w-full max-w-full shrink-0 aspect-[1755/1240] rotate-270 scale-140",
    imageClassName: "object-contain object-center",
  },
  {
    label: "Après",
    labelClassName: "text-sky-800",
    panelClassName: "border-sky-200 bg-sky-50",
    src: "/images/chronopost/leboncoinx4.pdf.jpg",
    alt: "Quatre bordereaux Chronopost regroupés sur une feuille A4",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
] as const

const LEBONCOIN_COMPARISON_IMAGES = [
  {
    label: "Avant",
    labelClassName: "text-slate-600",
    panelClassName: "border-slate-200 bg-slate-50",
    src: "/images/leboncoin/leboncoinx1.jpg",
    alt: "Bordereau Leboncoin imprimé seul sur une feuille",
    frameClassName: "w-full max-w-full shrink-0 aspect-[1755/1240] rotate-270 scale-140",
    imageClassName: "object-contain object-center",
  },
  {
    label: "Après",
    labelClassName: "text-sky-800",
    panelClassName: "border-sky-200 bg-sky-50",
    src: "/images/leboncoin/leboncoinx4.jpg",
    alt: "Quatre bordereaux Leboncoin regroupés sur une feuille A4",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
] as const

const MONDIAL_RELAY_COMPARISON_IMAGES = [
  {
    label: "Avant",
    labelClassName: "text-slate-600",
    panelClassName: "border-slate-200 bg-slate-50",
    src: "/images/mondial-relais/mondialx1.jpg",
    alt: "Bordereau Mondial Relay imprimé seul sur une feuille",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754] scale-110",
    imageClassName: "object-contain object-center",
  },
  {
    label: "Après",
    labelClassName: "text-sky-800",
    panelClassName: "border-sky-200 bg-sky-50",
    src: "/images/mondial-relais/mondialx4.jpg",
    alt: "Quatre bordereaux Mondial Relay regroupés sur une feuille A4",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
] as const

const HAPPY_POST_COMPARISON_IMAGES = [
  {
    label: "Avant",
    labelClassName: "text-slate-600",
    panelClassName: "border-slate-200 bg-slate-50",
    src: "/images/happy-post/happyx1.jpg",
    alt: "Bordereau Happy Post imprimé seul sur une feuille",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
  {
    label: "Après",
    labelClassName: "text-sky-800",
    panelClassName: "border-sky-200 bg-sky-50",
    src: "/images/happy-post/happyx4.jpg",
    alt: "Quatre bordereaux Happy Post regroupés sur une feuille A4",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
] as const

const COLISSIMO_COMPARISON_IMAGES = [
  {
    label: "Avant",
    labelClassName: "text-slate-600",
    panelClassName: "border-slate-200 bg-slate-50",
    src: "/images/colissimo/colissimox1.jpg",
    alt: "Bordereau Colissimo imprimé seul sur une feuille",
    frameClassName: "w-full max-w-full shrink-0 aspect-[1755/1240] rotate-270 scale-140",
    imageClassName: "object-contain object-center",
  },
  {
    label: "Après",
    labelClassName: "text-sky-800",
    panelClassName: "border-sky-200 bg-sky-50",
    src: "/images/colissimo/colissimox4.jpg",
    alt: "Quatre bordereaux Colissimo regroupés sur une feuille A4",
    frameClassName: "h-full max-h-full shrink-0 aspect-[1241/1754]",
    imageClassName: "object-contain object-center",
  },
] as const

function ImageComparisonVisual({
  previews,
}: {
  previews: readonly {
    label: string
    labelClassName: string
    panelClassName: string
    src: string
    alt: string
    frameClassName: string
    imageClassName: string
  }[]
}) {
  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/78 p-4 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.35)]">
      <div className="grid gap-4 sm:grid-cols-2">
        {previews.map((preview) => (
          <div key={preview.label}>
            <div className={`mb-3 text-sm font-semibold ${preview.labelClassName}`}>{preview.label}</div>
            <div className={`relative aspect-[3/4] overflow-hidden rounded-[22px] border ${preview.panelClassName}`}>
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <div className={`relative ${preview.frameClassName}`}>
                  <Image
                    src={preview.src}
                    alt={preview.alt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 42vw, 100vw"
                    className={preview.imageClassName}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChronopostSheetComparisonVisual() {
  return <ImageComparisonVisual previews={CHRONOPOST_COMPARISON_IMAGES} />
}

function LeboncoinSheetComparisonVisual() {
  return <ImageComparisonVisual previews={LEBONCOIN_COMPARISON_IMAGES} />
}

function MondialRelaySheetComparisonVisual() {
  return <ImageComparisonVisual previews={MONDIAL_RELAY_COMPARISON_IMAGES} />
}

function HappyPostSheetComparisonVisual() {
  return <ImageComparisonVisual previews={HAPPY_POST_COMPARISON_IMAGES} />
}

function ColissimoSheetComparisonVisual() {
  return <ImageComparisonVisual previews={COLISSIMO_COMPARISON_IMAGES} />
}

function SheetComparisonVisual({ pagePath }: { pagePath: string }) {
  if (
    pagePath === "/chronopost" ||
    pagePath === "/vinted" ||
    pagePath === "/entreprises" ||
    pagePath === "/economies"
  ) {
    return <ChronopostSheetComparisonVisual />
  }

  if (pagePath === "/leboncoin") {
    return <LeboncoinSheetComparisonVisual />
  }

  if (pagePath === "/mondial-relay") {
    return <MondialRelaySheetComparisonVisual />
  }

  if (pagePath === "/happy-post") {
    return <HappyPostSheetComparisonVisual />
  }

  if (pagePath === "/colissimo") {
    return <ColissimoSheetComparisonVisual />
  }

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/78 p-4 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.35)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-3 text-sm font-semibold text-slate-600">Avant</div>
          <div className="aspect-[3/4] rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="h-28 rounded-xl border border-slate-300 bg-white p-3 shadow-sm">
              <div className="h-3 w-3/4 rounded-full bg-slate-300" />
              <div className="mt-3 h-10 rounded-lg bg-slate-900" />
              <div className="mt-3 h-2 w-2/3 rounded-full bg-slate-200" />
            </div>
            <div className="mt-8 text-center text-sm text-slate-400">1 étiquette = 1 feuille</div>
          </div>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold text-sky-800">Après</div>
          <div className="grid aspect-[3/4] grid-cols-2 gap-3 rounded-[22px] border border-sky-200 bg-sky-50 p-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-sky-200 bg-white p-2 shadow-sm">
                <div className="h-2 w-3/4 rounded-full bg-sky-200" />
                <div className="mt-2 h-8 rounded-md bg-slate-900" />
                <div className="mt-2 h-1.5 w-2/3 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface SeoServicePageProps {
  page: SeoPageContent
  children?: React.ReactNode
}

export function SeoServicePage({ page, children }: SeoServicePageProps) {
  const primaryHref =
    page.path === "/economies" ? "#simulateur" : page.path === "/entreprises" ? "/economies#simulateur" : "/#outil"
  const pageLogo = SEO_PAGE_LOGOS[page.path]
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
        <div>
          <Link
            href="/landing"
            className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            Guide d’impression A4
          </Link>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {pageLogo && (
              <span className="flex h-12 items-center rounded-[18px] border border-slate-200/80 bg-white/82 px-4 shadow-sm">
                <Image
                  src={pageLogo.src}
                  alt={pageLogo.alt}
                  width={132}
                  height={44}
                  unoptimized
                  className="max-h-9 w-auto object-contain"
                  priority
                />
              </span>
            )}
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">{page.eyebrow}</p>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{page.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {page.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-slate-200/80 bg-white/82 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {highlight}
              </span>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)] transition hover:bg-slate-800"
            >
              {page.ctaLabel}
            </Link>
            <Link
              href="/tarifs"
              className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
            >
              Voir les offres premium
            </Link>
          </div>
        </div>

        <SheetComparisonVisual pagePath={page.path} />
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200/80 bg-white/76 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{page.problem.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{page.problem.text}</p>
        </article>
        <article className="rounded-[28px] border border-sky-200 bg-sky-50/78 p-6 shadow-[0_24px_60px_-48px_rgba(3,105,161,0.28)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{page.solution.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">{page.solution.text}</p>
        </article>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Cas d’usage</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Pour particuliers et professionnels
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Les mêmes PDF transporteurs peuvent être optimisés pour des envois ponctuels ou pour des volumes réguliers.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {page.useCases.map((useCase) => (
            <article
              key={useCase.title}
              className="rounded-[24px] border border-slate-200/80 bg-white/76 p-5 shadow-[0_20px_50px_-42px_rgba(15,23,42,0.28)]"
            >
              <h3 className="text-lg font-semibold text-slate-950">{useCase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{useCase.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Économie</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{page.economy.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{page.economy.text}</p>
          {page.path === "/entreprises" && (
            <Link
              href="/economies#simulateur"
              className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              Ouvrir le simulateur
            </Link>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/76 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)]">
          <h2 className="text-xl font-semibold text-slate-950">Processus simple</h2>
          <div className="mt-5 grid gap-3">
            {page.steps.map((step, index) => (
              <div key={step} className="flex gap-3 rounded-[20px] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {children && <div className="mt-12">{children}</div>}

      <section className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">FAQ</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Questions fréquentes</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {page.faqs.map((faq) => (
            <article key={faq.question} className="rounded-[24px] border border-slate-200/80 bg-white/76 p-5">
              <h3 className="text-lg font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_28px_70px_-45px_rgba(15,23,42,0.6)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Passez vos prochains PDF en A4 x4</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Utilisez l’outil existant pour importer vos PDF, appliquer le bon rognage et générer une planche A4 prête
              à imprimer.
            </p>
          </div>
          <Link
            href="/#outil"
            className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            Ouvrir l’outil
          </Link>
        </div>
      </section>
    </main>
  )
}
