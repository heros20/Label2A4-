import Link from "next/link"

interface PageShellProps {
  title: string
  intro: string
  children: React.ReactNode
}

export function PageShell({ title, intro, children }: PageShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/70 bg-white/84 p-6 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-8">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
        >
          Retour à l’outil
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{intro}</p>

        <div className="mt-8 space-y-8 text-slate-700">{children}</div>
      </div>
    </main>
  )
}
