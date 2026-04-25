"use client"

import {
  Calculator,
  Coins,
  Droplets,
  FileText,
  Info,
  LayoutGrid,
  Leaf,
  Printer,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

const PAPER_COST_PER_SHEET_EUR = 4.95 / 500
const BLACK_INK_EQUIVALENT_PER_STANDALONE_LABEL_EUR = 0.15
const FULL_STANDALONE_LABEL_PRINT_COST_EUR =
  PAPER_COST_PER_SHEET_EUR + BLACK_INK_EQUIVALENT_PER_STANDALONE_LABEL_EUR
const SHEETS_PER_REAM = 500
const A4_SHEET_WEIGHT_GRAMS = 5
const RANGE_MAX = 1000
const RANGE_TICKS = [0, 250, 500, 750, 1000] as const

function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMetric(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits,
  }).format(value)
}

function normalizePackages(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(Math.round(value), 0), 10000)
}

const STAT_CARD_STYLES = {
  slate: {
    card: "border-slate-200/80 bg-slate-50/90",
    iconWrap: "bg-slate-100 text-slate-500",
    title: "text-slate-700",
    caption: "text-slate-500",
  },
  sky: {
    card: "border-sky-200 bg-sky-50/90",
    iconWrap: "bg-sky-100 text-sky-700",
    title: "text-sky-900",
    caption: "text-sky-800",
  },
  emerald: {
    card: "border-emerald-200 bg-emerald-50/90",
    iconWrap: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-900",
    caption: "text-emerald-800",
  },
  amber: {
    card: "border-amber-200 bg-amber-50/90",
    iconWrap: "bg-amber-100 text-amber-700",
    title: "text-amber-900",
    caption: "text-amber-800",
  },
} as const

interface StatCardProps {
  icon: LucideIcon
  title: string
  value: string
  caption: string
  tone: keyof typeof STAT_CARD_STYLES
  badge?: string
}

function StatCard({ icon: Icon, title, value, caption, tone, badge }: StatCardProps) {
  const styles = STAT_CARD_STYLES[tone]

  return (
    <article className={`rounded-[24px] border p-5 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.28)] ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconWrap}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className={`text-sm font-semibold leading-5 ${styles.title}`}>{title}</h3>
        </div>
        {badge && (
          <span className="inline-flex rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-6 text-4xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className={`mt-2 text-sm ${styles.caption}`}>{caption}</p>
    </article>
  )
}

interface DetailCardProps {
  icon: LucideIcon
  iconClassName: string
  title: string
  value: string
  caption: string
  note: string
}

function DetailCard({ icon: Icon, iconClassName, title, value, caption, note }: DetailCardProps) {
  return (
    <article className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-40px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClassName}`} />
        <h4 className={`text-sm font-semibold ${iconClassName}`}>{title}</h4>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <p className="mt-1 text-sm font-medium text-slate-500">{caption}</p>
      <p className="mt-4 text-sm leading-6 text-slate-600">{note}</p>
    </article>
  )
}

interface EquivalentRowProps {
  icon: LucideIcon
  value: string
  label: string
}

function EquivalentRow({ icon: Icon, value, label }: EquivalentRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-base font-semibold text-slate-950">{value}</div>
        <p className="text-sm leading-5 text-slate-600">{label}</p>
      </div>
    </div>
  )
}

export function SavingsSimulator() {
  const [monthlyPackages, setMonthlyPackages] = useState(500)

  const savings = useMemo(() => {
    const sheetsWithoutOptimization = monthlyPackages
    const sheetsWithOptimization = Math.ceil(monthlyPackages / 4)
    const monthlySheetsSaved = Math.max(sheetsWithoutOptimization - sheetsWithOptimization, 0)
    const yearlySheetsSaved = monthlySheetsSaved * 12
    const monthlyPaperSavedEuro = monthlySheetsSaved * PAPER_COST_PER_SHEET_EUR
    const yearlyPaperSavedEuro = monthlyPaperSavedEuro * 12
    const monthlyEuroSaved = monthlySheetsSaved * FULL_STANDALONE_LABEL_PRINT_COST_EUR
    const yearlyEuroSaved = monthlyEuroSaved * 12
    const monthlyBlackInkSaved = monthlySheetsSaved * BLACK_INK_EQUIVALENT_PER_STANDALONE_LABEL_EUR
    const yearlyBlackInkSaved = monthlyBlackInkSaved * 12
    const paperReductionPercent =
      sheetsWithoutOptimization > 0 ? Math.round((monthlySheetsSaved / sheetsWithoutOptimization) * 100) : 0
    const yearlyReamsSaved = yearlySheetsSaved / SHEETS_PER_REAM
    const yearlyPaperWeightSavedKg = (yearlySheetsSaved * A4_SHEET_WEIGHT_GRAMS) / 1000

    return {
      sheetsWithoutOptimization,
      sheetsWithOptimization,
      monthlySheetsSaved,
      yearlySheetsSaved,
      monthlyPaperSavedEuro,
      yearlyPaperSavedEuro,
      monthlyEuroSaved,
      yearlyEuroSaved,
      monthlyBlackInkSaved,
      yearlyBlackInkSaved,
      paperReductionPercent,
      yearlyReamsSaved,
      yearlyPaperWeightSavedKg,
    }
  }, [monthlyPackages])

  return (
    <section
      id="simulateur"
      className="rounded-[32px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_32px_80px_-56px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Simulateur</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Calculez vos économies réelles</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Le calcul compare une impression classique à une feuille par étiquette avec une planche A4 x4. L’estimation
          inclut par défaut le papier et une hypothèse d’encre noire moyenne à 0,15 € par bordereau.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
        <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
          <label htmlFor="monthly-packages" className="block text-sm font-semibold text-slate-900">
            Colis par mois
          </label>
          <input
            id="monthly-packages"
            type="number"
            min={0}
            max={10000}
            inputMode="numeric"
            value={monthlyPackages}
            onChange={(event) => setMonthlyPackages(normalizePackages(Number(event.target.value)))}
            className="mt-3 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-2xl font-semibold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <input
            type="range"
            min={0}
            max={RANGE_MAX}
            value={Math.min(monthlyPackages, RANGE_MAX)}
            onChange={(event) => setMonthlyPackages(normalizePackages(Number(event.target.value)))}
            aria-label="Volume de colis par mois"
            className="w-full accent-sky-700"
          />
          <div className="relative mt-2 h-4 text-[11px] font-medium text-slate-400">
            {RANGE_TICKS.map((tick) => {
              const isFirst = tick === 0
              const isLast = tick === RANGE_MAX
              const left = `${(tick / RANGE_MAX) * 100}%`

              return (
                <span
                  key={tick}
                  className={`absolute top-0 whitespace-nowrap ${
                    isFirst ? "-translate-x-0 text-left" : isLast ? "-translate-x-full text-right" : "-translate-x-1/2 text-center"
                  }`}
                  style={{ left }}
                >
                  {isLast ? "1000+" : tick}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-live="polite">
        <StatCard
          icon={FileText}
          title="Feuilles sans optimisation"
          value={formatInteger(savings.sheetsWithoutOptimization)}
          caption="par mois"
          tone="slate"
        />
        <StatCard
          icon={LayoutGrid}
          title="Feuilles avec A4 x4"
          value={formatInteger(savings.sheetsWithOptimization)}
          caption="par mois"
          tone="sky"
        />
        <StatCard
          icon={Leaf}
          title="Feuilles économisées"
          value={formatInteger(savings.monthlySheetsSaved)}
          caption={`soit ${formatInteger(savings.yearlySheetsSaved)} par an`}
          tone="emerald"
          badge={`-${formatInteger(savings.paperReductionPercent)}%`}
        />
        <StatCard
          icon={Coins}
          title="Économies totales estimées (papier + encre)"
          value={`${formatEuro(savings.monthlyEuroSaved)} / mois`}
          caption={`soit ${formatEuro(savings.yearlyEuroSaved)} par an`}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_320px]">
        <div className="overflow-hidden rounded-[30px] border border-emerald-200 bg-[radial-gradient(circle_at_left,rgba(74,222,128,0.22),transparent_30%),linear-gradient(135deg,rgba(240,253,244,0.98),rgba(236,253,245,0.84))] p-6 shadow-[0_28px_70px_-52px_rgba(34,197,94,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_24px_60px_-28px_rgba(34,197,94,0.6)] ring-8 ring-white/70">
              <Trophy className="h-11 w-11" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Résultat</p>
              <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                Jusqu&apos;à {formatEuro(savings.monthlyEuroSaved)} d&apos;économies chaque mois !
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700 sm:text-base">
                Soit {formatEuro(savings.yearlyEuroSaved)} par an économisés sur vos impressions de bordereaux.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] border border-white/80 bg-white/85 p-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Papier</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    {formatInteger(savings.yearlySheetsSaved)} feuilles
                  </div>
                  <p className="text-sm text-slate-600">économisées par an</p>
                </div>
                <div className="rounded-[18px] border border-white/80 bg-white/85 p-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Encre</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">
                    {formatEuro(savings.monthlyBlackInkSaved)}
                  </div>
                  <p className="text-sm text-slate-600">économisés par mois</p>
                </div>
                <div className="rounded-[18px] border border-white/80 bg-white/85 p-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Impact</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">-{formatInteger(savings.paperReductionPercent)}%</div>
                  <p className="text-sm text-slate-600">de papier utilisé</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[30px] border border-emerald-200/80 bg-white/92 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Équivalent à :</p>
          <div className="mt-4 space-y-3">
            <EquivalentRow
              icon={FileText}
              value={formatInteger(savings.monthlySheetsSaved)}
              label="feuilles économisées par mois"
            />
            <EquivalentRow
              icon={Printer}
              value={formatMetric(savings.yearlyReamsSaved)}
              label="ramettes A4 préservées par an"
            />
            <EquivalentRow
              icon={Leaf}
              value={`${formatMetric(savings.yearlyPaperWeightSavedKg)} kg`}
              label="de papier évités par an"
            />
          </div>
        </aside>
      </div>

      <div className="mt-6 rounded-[30px] border border-slate-200/80 bg-slate-50/75 p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.2)]">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
            <Calculator className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-950">Détail des économies</h3>
          <Info className="h-4 w-4 text-slate-400" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.15fr]">
          <DetailCard
            icon={FileText}
            iconClassName="text-sky-700"
            title="Estimation basse (papier seul)"
            value={`${formatEuro(savings.monthlyPaperSavedEuro)} / mois`}
            caption={`soit ${formatEuro(savings.yearlyPaperSavedEuro)} par an`}
            note="Basée sur le coût du papier seul à 0,0099 € par feuille A4."
          />
          <DetailCard
            icon={Droplets}
            iconClassName="text-violet-600"
            title="Économie d’encre"
            value={`${formatEuro(savings.monthlyBlackInkSaved)} / mois`}
            caption={`soit ${formatEuro(savings.yearlyBlackInkSaved)} par an`}
            note="Basée sur 0,15 € d’encre noire estimée par bordereau imprimé seul."
          />
          <DetailCard
            icon={Coins}
            iconClassName="text-amber-700"
            title="Estimation haute (papier + encre)"
            value={`${formatEuro(savings.monthlyEuroSaved)} / mois`}
            caption={`soit ${formatEuro(savings.yearlyEuroSaved)} par an`}
            note="Basée sur le papier + l’encre, soit 0,1599 € par bordereau imprimé seul évité."
          />

          <article className="rounded-[22px] border border-sky-100 bg-sky-50/80 p-5 shadow-[0_16px_45px_-40px_rgba(15,23,42,0.25)]">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-sky-700" />
              <h4 className="text-sm font-semibold text-sky-700">Comment c’est calculé ?</h4>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
              <p>
                Feuilles économisées = <strong>{formatInteger(savings.sheetsWithoutOptimization)}</strong> -{" "}
                <strong>ceil({formatInteger(savings.sheetsWithoutOptimization)} / 4)</strong> ={" "}
                <strong>{formatInteger(savings.monthlySheetsSaved)}</strong>.
              </p>
              <p>
                Coût évité par bordereau seul = <strong>0,0099 €</strong> de feuille + <strong>0,15 €</strong> d’encre
                = <strong>0,1599 €</strong>.
              </p>
              <p>
                Pour votre volume actuel, cela représente <strong>{formatEuro(savings.monthlyPaperSavedEuro)}</strong>{" "}
                de papier et <strong>{formatEuro(savings.monthlyBlackInkSaved)}</strong> d’encre, soit{" "}
                <strong>{formatEuro(savings.monthlyEuroSaved)}</strong> par mois.
              </p>
            </div>
          </article>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[20px] border border-sky-100 bg-sky-50/85 px-4 py-3 text-sm leading-6 text-slate-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
        <p>
          <strong>Bon à savoir :</strong> cette estimation varie selon votre imprimante, la couverture noire réelle des
          bordereaux, le type de cartouche ou toner et vos réglages d’impression.
        </p>
      </div>
    </section>
  )
}
