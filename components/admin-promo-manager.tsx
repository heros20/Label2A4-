"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

interface AdminPromoCodeView {
  active: boolean
  code: string
  discountLabel: string
  expiresAt: string | null
  label: string
  limitsLabel: string
  plansLabel: string
  utility: string
}

type PromoKind = "fixed" | "percent" | "trial"
type PromoPlanId = "monthly" | "annual" | "day-pass"

interface AdminPromoManagerProps {
  configured: boolean
  promoCodes: AdminPromoCodeView[]
}

const planOptions: Array<{ id: PromoPlanId; label: string }> = [
  { id: "monthly", label: "Mensuel" },
  { id: "annual", label: "Annuel" },
  { id: "day-pass", label: "Pass 24h" },
]

function parseOptionalInteger(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

export function AdminPromoManager({ configured, promoCodes }: AdminPromoManagerProps) {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [label, setLabel] = useState("")
  const [kind, setKind] = useState<PromoKind>("percent")
  const [discountPercent, setDiscountPercent] = useState("20")
  const [discountFixedEuro, setDiscountFixedEuro] = useState("5")
  const [trialDays, setTrialDays] = useState("7")
  const [maxRedemptions, setMaxRedemptions] = useState("")
  const [maxRedemptionsPerIdentity, setMaxRedemptionsPerIdentity] = useState("1")
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedPlans, setSelectedPlans] = useState<Record<PromoPlanId, boolean>>({
    annual: true,
    "day-pass": true,
    monthly: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toggleCode, setToggleCode] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const activePlanIds = useMemo(
    () => planOptions.filter((plan) => selectedPlans[plan.id]).map((plan) => plan.id),
    [selectedPlans],
  )

  const submitCreatePromo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError("")
    setMessage("")

    try {
      if (activePlanIds.length === 0) {
        throw new Error("Selectionnez au moins une offre compatible.")
      }

      const discountValue =
        kind === "percent"
          ? Number(discountPercent)
          : kind === "fixed"
            ? Math.round(Number(discountFixedEuro.replace(",", ".")) * 100)
            : null

      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: true,
          appliesToPlans: activePlanIds,
          code,
          discountValue,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          kind,
          label,
          maxRedemptions: parseOptionalInteger(maxRedemptions),
          maxRedemptionsPerIdentity: parseOptionalInteger(maxRedemptionsPerIdentity),
          notes,
          trialDays: kind === "trial" ? Number(trialDays) : null,
        }),
      })
      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Impossible de creer le code promo.")
      }

      setMessage("Code promo cree.")
      setCode("")
      setLabel("")
      setNotes("")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de creer le code promo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePromo = async (promo: AdminPromoCodeView) => {
    setToggleCode(promo.code)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          active: !promo.active,
          code: promo.code,
        }),
      })
      const payload = (await response.json()) as { error?: string; ok?: boolean }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Impossible de modifier le code promo.")
      }

      setMessage(promo.active ? "Code promo desactive." : "Code promo active.")
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible de modifier le code promo.")
    } finally {
      setToggleCode("")
    }
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={submitCreatePromo} className="rounded-[20px] border border-slate-200/80 bg-white/85 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-950">Créer un code promo</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Création sécurisée côté serveur, sans prix transmis par le client au moment du paiement.
            </p>
          </div>
          <div
            className={
              configured
                ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                : "w-fit rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
            }
          >
            {configured ? "Configuration prête" : "Configuration requise"}
          </div>
        </div>

        <fieldset disabled={!configured || isSubmitting} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.currentTarget.value.toUpperCase())}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Libellé
            <input
              value={label}
              onChange={(event) => setLabel(event.currentTarget.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Type
            <select
              value={kind}
              onChange={(event) => setKind(event.currentTarget.value as PromoKind)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            >
              <option value="percent">Réduction en %</option>
              <option value="fixed">Réduction fixe</option>
              <option value="trial">Essai gratuit</option>
            </select>
          </label>

          {kind === "percent" && (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Pourcentage
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.currentTarget.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
            </label>
          )}

          {kind === "fixed" && (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Montant en euros
              <input
                inputMode="decimal"
                value={discountFixedEuro}
                onChange={(event) => setDiscountFixedEuro(event.currentTarget.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
            </label>
          )}

          {kind === "trial" && (
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Jours d'essai
              <input
                type="number"
                min="1"
                value={trialDays}
                onChange={(event) => setTrialDays(event.currentTarget.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                required
              />
            </label>
          )}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Limite globale
            <input
              type="number"
              min="1"
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.currentTarget.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Limite par identité
            <input
              type="number"
              min="1"
              value={maxRedemptionsPerIdentity}
              onChange={(event) => setMaxRedemptionsPerIdentity(event.currentTarget.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Expiration
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.currentTarget.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <div className="grid gap-2 text-sm font-medium text-slate-700">
            Plans compatibles
            <div className="flex flex-wrap gap-2">
              {planOptions.map((plan) => (
                <label
                  key={plan.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlans[plan.id]}
                    onChange={(event) =>
                      setSelectedPlans((current) => ({
                        ...current,
                        [plan.id]: event.currentTarget.checked,
                      }))
                    }
                  />
                  {plan.label}
                </label>
              ))}
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
            Notes internes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>
        </fieldset>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!configured || isSubmitting}
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? "Création..." : "Créer le code"}
          </button>
          {!configured && (
            <p className="text-sm text-amber-800">Terminez la configuration des codes promo pour activer la création.</p>
          )}
          {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </form>

      <div className="grid gap-3">
        {promoCodes.length === 0 ? (
          <div className="rounded-[18px] border border-slate-200/80 bg-white p-4 text-sm leading-6 text-slate-600">
            {configured
              ? "Aucun code promo n'est configuré pour le moment."
              : "Terminez la configuration promo pour gérer les codes depuis cette interface."}
          </div>
        ) : promoCodes.map((promo) => (
          <div key={promo.code} className="rounded-[18px] border border-slate-200/80 bg-white p-4 text-sm text-slate-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-mono text-sm font-semibold text-slate-950">{promo.code}</div>
                <div className="mt-1 font-medium text-slate-900">{promo.label}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={
                    promo.active
                      ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"
                      : "w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500"
                  }
                >
                  {promo.active ? "actif" : "inactif"}
                </div>
                {configured && (
                  <button
                    type="button"
                    onClick={() => togglePromo(promo)}
                    disabled={toggleCode === promo.code}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-sky-300 hover:text-sky-800 disabled:opacity-50"
                  >
                    {toggleCode === promo.code ? "Modification..." : promo.active ? "Désactiver" : "Activer"}
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <p>
                <strong>Avantage :</strong> {promo.discountLabel}
              </p>
              <p>
                <strong>Plans :</strong> {promo.plansLabel}
              </p>
              <p>
                <strong>Limites :</strong> {promo.limitsLabel}
              </p>
              <p>
                <strong>Expiration :</strong> {promo.expiresAt ?? "aucune"}
              </p>
            </div>
            <p className="mt-3 text-slate-600">
              <strong>Utilite :</strong> {promo.utility}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
