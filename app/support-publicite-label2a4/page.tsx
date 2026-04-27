import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Support publicité Label2A4",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function SupportFlyerPage() {
  const previewHref = "/api/support-publicite-label2a4"
  const downloadHref = `${previewHref}?download=1`

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Support flyer</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Flyer colis Label2A4
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Cette page n'est pas indexée. Elle sert à récupérer le support A4 à glisser dans les colis.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ouvrir / imprimer
          </a>
          <a
            href={downloadHref}
            className="inline-flex rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800"
          >
            Télécharger le fichier HTML
          </a>
        </div>

        <div className="mt-6 rounded-[20px] border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
          <div className="font-semibold">Lien direct</div>
          <p className="mt-1">
            Tu peux récupérer ce support depuis <code className="font-mono">https://label2a4.com/support-publicite-label2a4</code>.
          </p>
        </div>
      </section>
    </main>
  )
}
