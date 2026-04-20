"use client"

import { useMemo, useState } from "react"

const COST_PER_SHEET_EUR = 0.1

function formatInteger(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizePackages(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(Math.round(value), 0), 10000)
}

export function SavingsSimulator() {
  const [monthlyPackages, setMonthlyPackages] = useState(80)

  const savings = useMemo(() => {
    const sheetsWithoutOptimization = monthlyPackages
    const sheetsWithOptimization = Math.ceil(monthlyPackages / 4)
    const monthlySheetsSaved = Math.max(sheetsWithoutOptimization - sheetsWithOptimization, 0)
    const yearlySheetsSaved = monthlySheetsSaved * 12
    const monthlyEuroSaved = monthlySheetsSaved * COST_PER_SHEET_EUR
    const yearlyEuroSaved = monthlyEuroSaved * 12

    return {
      sheetsWithoutOptimization,
      sheetsWithOptimization,
      monthlySheetsSaved,
      yearlySheetsSaved,
      monthlyEuroSaved,
      yearlyEuroSaved,
    }
  }, [monthlyPackages])

  return (
    <section
      id="simulateur"
      className="rounded-[28px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8"
    >
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-800">Simulateur</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Estimez vos économies papier
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Indiquez votre volume de colis mensuel. Le calcul compare une impression classique à une feuille par
            étiquette avec une planche A4 x4. L’estimation financière utilise 0,10 € par feuille imprimée.
          </p>

          <label htmlFor="monthly-packages" className="mt-6 block text-sm font-semibold text-slate-900">
            Colis par mois
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="monthly-packages"
              type="number"
              min={0}
              max={10000}
              inputMode="numeric"
              value={monthlyPackages}
              onChange={(event) => setMonthlyPackages(normalizePackages(Number(event.target.value)))}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-semibold text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:w-44"
            />
            <input
              type="range"
              min={0}
              max={500}
              value={Math.min(monthlyPackages, 500)}
              onChange={(event) => setMonthlyPackages(normalizePackages(Number(event.target.value)))}
              aria-label="Volume de colis par mois"
              className="w-full accent-sky-700"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
          <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/90 p-5">
            <div className="text-sm text-slate-500">Feuilles sans optimisation</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">
              {formatInteger(savings.sheetsWithoutOptimization)}
            </div>
            <p className="mt-2 text-sm text-slate-500">par mois</p>
          </div>
          <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-5">
            <div className="text-sm text-sky-800">Feuilles avec A4 x4</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">
              {formatInteger(savings.sheetsWithOptimization)}
            </div>
            <p className="mt-2 text-sm text-sky-800">par mois</p>
          </div>
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm text-emerald-800">Feuilles économisées</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">
              {formatInteger(savings.monthlySheetsSaved)}
            </div>
            <p className="mt-2 text-sm text-emerald-800">
              soit {formatInteger(savings.yearlySheetsSaved)} par an
            </p>
          </div>
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <div className="text-sm text-amber-800">Économies estimées</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">
              {formatEuro(savings.monthlyEuroSaved)}
            </div>
            <p className="mt-2 text-sm text-amber-800">soit {formatEuro(savings.yearlyEuroSaved)} par an</p>
          </div>
        </div>
      </div>
    </section>
  )
}
