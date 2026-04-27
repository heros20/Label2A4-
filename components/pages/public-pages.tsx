import Link from "next/link"
import { AnalyticsEventOnMount } from "@/components/analytics-event-on-mount"
import { AccountAuthCard } from "@/components/account-auth-card"
import { AccountPortal } from "@/components/account-portal"
import { BillingPortalButton } from "@/components/billing-portal-button"
import { CheckoutButton } from "@/components/checkout-button"
import { ContactForm } from "@/components/contact-form"
import { LegalWarning } from "@/components/legal-warning"
import { PageShell } from "@/components/page-shell"
import { PasswordResetCard } from "@/components/password-reset-card"
import { localizePath, type Locale } from "@/lib/i18n"
import { formatEuroFromCents, siteConfig } from "@/lib/site-config"

const cardClass =
  "rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_22px_50px_-42px_rgba(15,23,42,0.24)]"

function getFaqItems(locale: Locale) {
  return locale === "en"
    ? [
        {
          question: "How many A4 sheets are included for free each day?",
          answer: `The free plan includes up to ${siteConfig.pricing.freeDailyA4Sheets} exported A4 sheet(s) per day.`,
        },
        {
          question: "How do I switch to unlimited usage?",
          answer: `You can buy a 24-hour pass for ${formatEuroFromCents(siteConfig.pricing.dayPassPriceCents, locale)} or subscribe to a monthly or annual plan from the Pricing page.`,
        },
        {
          question: "How do I cancel?",
          answer: "Cancellation is handled online from the Cancellation page. If the portal is unavailable, support can help.",
        },
        {
          question: "What if my PDF does not generate?",
          answer: `First check the PDF format and readability, then contact ${siteConfig.supportEmail} with the carrier name and a screenshot of the error message.`,
        },
        {
          question: "Does the site keep my PDF files?",
          answer: siteConfig.dataHandling.keepUploadedPdfs
            ? "PDF files are kept according to the privacy policy published on the site."
            : "No. PDF files are processed only long enough to generate the requested result and are not kept by the site.",
        },
      ]
    : [
        {
          question: "Combien de planches A4 sont offertes par jour ?",
          answer: `La formule gratuite permet jusqu’à ${siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 exportée(s) par jour.`,
        },
        {
          question: "Comment passer en illimité ?",
          answer: `Vous pouvez acheter un pass 24h à ${formatEuroFromCents(siteConfig.pricing.dayPassPriceCents, locale)} ou souscrire un abonnement mensuel/annuel depuis la page Tarifs.`,
        },
        {
          question: "Comment résilier ?",
          answer: "La résiliation s’effectue en ligne depuis la page Résiliation. Si le portail n’est pas disponible, le support prend le relais.",
        },
        {
          question: "Que faire si mon PDF ne se génère pas ?",
          answer: `Vérifiez d’abord le format et la lisibilité du PDF, puis contactez ${siteConfig.supportEmail} avec le transporteur concerné et une capture d’écran du message d’erreur.`,
        },
        {
          question: "Le site conserve-t-il mes fichiers PDF ?",
          answer: siteConfig.dataHandling.keepUploadedPdfs
            ? "Les PDF sont conservés selon la politique de confidentialité publiée sur le site."
            : "Non. Les PDF sont traités uniquement le temps de produire le résultat demandé puis ne sont pas conservés par le site.",
        },
      ]
}

export function PricingPageContent({ locale }: { locale: Locale }) {
  const annualMonthlyEquivalent = formatEuroFromCents(Math.round(siteConfig.pricing.annualPriceCents / 12), locale)

  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Pricing" : "Tarifs"}
      intro={
        locale === "en"
          ? "Free to test, a 24-hour pass for occasional needs, and subscriptions for regular sellers."
          : "Gratuit pour tester, pass 24h pour les besoins ponctuels, abonnement pour les vendeurs réguliers."
      }
    >
      <AnalyticsEventOnMount eventName="pricing_viewed" />
      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            {locale === "en" ? "Free" : "Gratuit"}
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">0 €</div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {locale === "en"
              ? `Up to ${siteConfig.pricing.guestDailyA4Sheets} A4 sheet(s) as a guest, then ${siteConfig.pricing.freeAccountDailyA4Sheets} with a free account. Ideal for testing the service or handling occasional volume.`
              : `Jusqu'à ${siteConfig.pricing.guestDailyA4Sheets} planche(s) A4 en invité, puis ${siteConfig.pricing.freeAccountDailyA4Sheets} avec un compte gratuit. Idéal pour tester le service ou gérer un volume occasionnel.`}
          </p>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">
            {locale === "en" ? "24-hour pass" : "Pass 24h"}
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.dayPassPriceCents, locale)}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {locale === "en"
              ? "Unlimited access for 24 hours, without ads. Useful for large one-off batches."
              : "Accès illimité pendant 24 heures, sans publicité. Pratique pour les gros lots ponctuels."}
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="day-pass"
              label={locale === "en" ? "Buy the 24-hour pass" : "Acheter le pass 24h"}
              locale={locale}
              className="w-full bg-slate-950 text-white hover:bg-slate-800"
            />
          </div>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
            {locale === "en" ? "Monthly" : "Mensuel"}
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.monthlyPriceCents, locale)}
            <span className="text-base font-medium text-slate-500">{locale === "en" ? " / month" : " / mois"}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {locale === "en"
              ? "Unlimited subscription, ad-free, with access to the account area. A good fit if you ship year-round."
              : "Abonnement illimité, sans publicité et avec accès à l’espace client. Adapté si vous expédiez toute l'année."}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {locale === "en"
              ? "Account area: plan status, billing portal, invoices and cancellation."
              : "Espace client : état du plan, accès au portail de facturation, factures et résiliation."}
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="monthly"
              label={locale === "en" ? "Choose the monthly plan" : "Choisir l’offre mensuelle"}
              locale={locale}
              className="w-full bg-[linear-gradient(135deg,#0f172a,#0369a1)] text-white hover:brightness-110"
            />
          </div>
        </section>

        <section className={cardClass}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            {locale === "en" ? "Annual" : "Annuel"}
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-950">
            {formatEuroFromCents(siteConfig.pricing.annualPriceCents, locale)}
            <span className="text-base font-medium text-slate-500">{locale === "en" ? " / year" : " / an"}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {locale === "en"
              ? "Unlimited version for 12 months, ad-free, with access to the account area."
              : "Version illimitée sur 12 mois, sans publicité, avec accès à l’espace client."}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {locale === "en" ? `Equivalent to about ${annualMonthlyEquivalent} / month.` : `Revient à environ ${annualMonthlyEquivalent} / mois.`}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {locale === "en"
              ? "Account area: plan status, billing portal, invoices and cancellation."
              : "Espace client : état du plan, accès au portail de facturation, factures et résiliation."}
          </p>
          <div className="mt-5">
            <CheckoutButton
              planId="annual"
              label={locale === "en" ? "Choose the annual plan" : "Choisir l’offre annuelle"}
              locale={locale}
              className="w-full bg-[linear-gradient(135deg,#064e3b,#10b981)] text-white hover:brightness-110"
            />
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Before purchase" : "Avant achat"}</h2>
        <p>
          {locale === "en"
            ? "Renewal, cancellation, refund and withdrawal conditions are detailed in the"
            : "Les conditions de renouvellement, de résiliation, de remboursement et de droit de rétractation sont détaillées dans les"}{" "}
          <Link href={localizePath("/cgv", locale)} className="text-sky-800 hover:underline">
            CGV
          </Link>
          .
        </p>
        <p>
          {locale === "en" ? "The account area will be available after purchase from" : "L’espace client sera disponible après achat depuis"}{" "}
          <Link href={localizePath("/compte", locale)} className="text-sky-800 hover:underline">
            {locale === "en" ? "My account" : "Mon compte"}
          </Link>
          .
        </p>
      </section>
    </PageShell>
  )
}

export function FaqPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title="FAQ"
      intro={locale === "en" ? "Frequently asked questions for free and premium users." : "Questions fréquentes pour les utilisateurs gratuits et premium."}
    >
      {getFaqItems(locale).map((item) => (
        <section key={item.question} className="rounded-[24px] border border-slate-200/80 bg-white/70 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{item.question}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
        </section>
      ))}
    </PageShell>
  )
}

export function ContactPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title="Support"
      intro={
        locale === "en"
          ? "Contact support for any question about the service, a PDF generation issue, an unsupported label or a subscription request."
          : "Contactez le support pour toute question sur le service, un problème de génération PDF, une étiquette non reconnue ou une demande liée à votre abonnement."
      }
    >
      <section className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/80 p-5 text-sm leading-6 text-emerald-950 shadow-[0_18px_40px_-34px_rgba(34,197,94,0.18)]">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "Your label is not supported yet?" : "Votre étiquette n'est pas encore prise en charge ?"}
        </h2>
        <p className="mt-3">
          {locale === "en"
            ? "Send us the original PDF through the form below with an attachment. It helps us verify the exact format and see whether a matching profile or variant can be added."
            : "Envoyez-nous le PDF source via le formulaire ci-dessous avec une pièce jointe. Cela nous permet de vérifier le format exact et de voir si un profil ou une variante adaptée peut être ajouté."}
        </p>
      </section>

      <ContactForm locale={locale} supportEmail={siteConfig.supportEmail} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Support email" : "Email de support"}</h2>
        <p>
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
        </p>
        <p>{locale === "en" ? "Reply within 2 business days." : siteConfig.supportResponseDelay}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "Useful details when reporting a bug" : "Informations utiles en cas de bug"}
        </h2>
        <p>{locale === "en" ? "If possible, please include:" : "Merci d’indiquer si possible :"}</p>
        <ul className="list-disc pl-6 text-sm leading-7 text-slate-600">
          {(
            locale === "en"
              ? [
                  "the carrier involved",
                  "the number of A4 sheets you expected",
                  "a screenshot of the error message",
                  "the date and time of the issue",
                ]
              : [
                  "le transporteur concerné",
                  "le nombre de planches attendues",
                  "une capture d’écran du message d’erreur",
                  "la date et l’heure de l’incident",
                ]
          ).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}

export function AccountPageContent({ locale, statusMessage }: { locale: Locale; statusMessage: string }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "My account" : "Mon compte"}
      intro={
        locale === "en"
          ? "Find your premium access, quota and billing details after signing in with email and password."
          : "Retrouvez vos accès premium, votre quota et votre facturation après connexion avec email et mot de passe."
      }
    >
      <AnalyticsEventOnMount eventName="account_viewed" />
      {statusMessage && (
        <section className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-900">
          {statusMessage}
        </section>
      )}
      <AccountPortal locale={locale} />
    </PageShell>
  )
}

export function getAccountStatusMessage(locale: Locale, value: string | undefined) {
  if (value === "account-confirmed") {
    return locale === "en"
      ? "Your account has been confirmed. You are now signed in to your Label2A4 account."
      : "Votre compte est confirme. Vous etes maintenant connecte a votre espace Label2A4."
  }

  if (value === "password-created") {
    return locale === "en"
      ? "Your password is set. Your account is ready."
      : "Votre mot de passe est enregistre. Votre compte est pret."
  }

  return ""
}

export function ConnexionPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Sign in" : "Connexion"}
      intro={
        locale === "en"
          ? "Sign in to your Label2A4 account with your email and password."
          : "Connectez-vous à votre espace Label2A4 avec votre email et votre mot de passe."
      }
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Sign in" : "Se connecter"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "en"
            ? "Email sign-in links remain available as a secondary option."
            : "Le lien de connexion par email reste disponible en option secondaire."}
        </p>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="sign-in" isAuthenticated={false} locale={locale} />
        </div>
      </section>
    </PageShell>
  )
}

export function InscriptionPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Create account" : "Créer un compte"}
      intro={
        locale === "en"
          ? "Create your Label2A4 account with an email and password to find your purchases, quotas and invoices."
          : "Créez votre compte Label2A4 avec un email et un mot de passe pour retrouver vos achats, quotas et factures."
      }
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "New account" : "Nouveau compte"}</h2>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="sign-up" isAuthenticated={false} locale={locale} />
        </div>
      </section>
    </PageShell>
  )
}

export function ForgotPasswordPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Forgot password" : "Mot de passe oublié"}
      intro={
        locale === "en"
          ? "Receive a secure email to set a new Label2A4 password."
          : "Recevez un email sécurisé pour définir un nouveau mot de passe Label2A4."
      }
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Reset" : "Réinitialisation"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {locale === "en"
            ? "The email contains a temporary link to the page where you set your new password."
            : "L’email contient un lien valable temporairement vers la page de définition du nouveau mot de passe."}
        </p>
        <div className="mt-5 max-w-md">
          <AccountAuthCard initialMode="forgot-password" isAuthenticated={false} locale={locale} />
        </div>
      </section>
    </PageShell>
  )
}

export function ResetPasswordPageContent({
  initialIsFirstLogin,
  locale,
  nextPath,
}: {
  initialIsFirstLogin: boolean
  locale: Locale
  nextPath: string
}) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "New password" : "Nouveau mot de passe"}
      intro={
        locale === "en"
          ? "Choose a new password to secure your Label2A4 account."
          : "Choisissez un nouveau mot de passe pour sécuriser votre compte Label2A4."
      }
    >
      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "Update password" : "Mettre à jour le mot de passe"}
        </h2>
        <div className="mt-5 max-w-md">
          <PasswordResetCard initialIsFirstLogin={initialIsFirstLogin} locale={locale} nextPath={nextPath} />
        </div>
      </section>
    </PageShell>
  )
}

export function PaymentSuccessPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Payment confirmed" : "Paiement confirmé"}
      intro={
        locale === "en"
          ? "Your payment was confirmed successfully. Your premium access will be attached to your account and visible from the account area."
          : "Votre paiement a bien été confirmé. Votre accès premium sera rattaché à votre compte et visible depuis l'espace client."
      }
    >
      <AnalyticsEventOnMount eventName="payment_success_page_view" />
      <div className="flex flex-wrap gap-3">
        <Link href={localizePath("/", locale)} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {locale === "en" ? "Back to the tool" : "Revenir à l'outil"}
        </Link>
        <Link href={localizePath("/compte", locale)} className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800">
          {locale === "en" ? "Open my account" : "Ouvrir mon compte"}
        </Link>
      </div>
    </PageShell>
  )
}

export function PaymentCancelledPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Payment cancelled" : "Paiement annulé"}
      intro={
        locale === "en"
          ? "The payment was not completed. You can keep using the free plan or restart checkout from the Pricing page."
          : "Le paiement n’a pas été finalisé. Vous pouvez reprendre votre utilisation gratuite ou relancer l’achat depuis la page Tarifs."
      }
    >
      <AnalyticsEventOnMount eventName="checkout_cancelled_page_view" />
      <div className="flex flex-wrap gap-3">
        <Link href={localizePath("/tarifs", locale)} className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          {locale === "en" ? "Back to pricing" : "Retour aux tarifs"}
        </Link>
        <Link href={localizePath("/", locale)} className="inline-flex items-center rounded-full border border-slate-200/80 bg-white px-5 py-3 text-sm font-semibold text-slate-800">
          {locale === "en" ? "Back to the tool" : "Retour à l’outil"}
        </Link>
      </div>
    </PageShell>
  )
}

export function LegalNoticePageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} title={locale === "en" ? "Legal notice" : "Mentions légales"} intro="">
      <LegalWarning locale={locale} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Site publisher" : "Éditeur du site"}</h2>
        <p><strong>{locale === "en" ? "Site name:" : "Nom du site :"}</strong> {siteConfig.siteName}</p>
        <p><strong>{locale === "en" ? "Operator:" : "Exploitant :"}</strong> {siteConfig.business.businessName}</p>
        <p><strong>{locale === "en" ? "Manager:" : "Responsable :"}</strong> {siteConfig.business.ownerName}</p>
        <p><strong>{locale === "en" ? "Legal form:" : "Forme juridique :"}</strong> {siteConfig.business.legalForm}</p>
        <p><strong>{locale === "en" ? "Micro-business status:" : "Micro-entreprise :"}</strong> {siteConfig.business.microEnterpriseStatus}</p>
        <p><strong>{locale === "en" ? "Address:" : "Adresse :"}</strong> {siteConfig.business.address}</p>
        <p><strong>SIREN:</strong> {siteConfig.business.siren}</p>
        <p><strong>SIRET:</strong> {siteConfig.business.siret}</p>
        <p><strong>{locale === "en" ? "VAT number:" : "TVA intracommunautaire :"}</strong> {siteConfig.business.vatNumber}</p>
        <p><strong>{locale === "en" ? "RCS registration:" : "Inscription au RCS :"}</strong> {siteConfig.business.rcsStatus}</p>
        <p><strong>{locale === "en" ? "RNE registration:" : "Inscription au RNE :"}</strong> {siteConfig.business.rneStatus}</p>
        <p><strong>Email:</strong> {siteConfig.supportEmail}</p>
        <p><strong>{locale === "en" ? "Publishing director:" : "Directeur de la publication :"}</strong> {siteConfig.business.publicationDirector}</p>
      </section>
    </PageShell>
  )
}

export function TermsPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Terms and conditions of sale" : "Conditions generales de vente"}
      intro=""
    >
      <LegalWarning locale={locale} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "1. Scope" : "1. Objet"}</h2>
        <p>
          {locale === "en"
            ? `These terms define how ${siteConfig.siteName} provides its service for preparing PDF shipping labels on A4 sheets.`
            : `Les presentes CGV definissent les conditions de fourniture du service ${siteConfig.siteName}, outil de preparation d'etiquettes PDF sur planches A4.`}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "2. Plans and prices" : "2. Offres et prix TTC"}
        </h2>
        <p>
          <strong>{locale === "en" ? "Free:" : "Gratuit :"}</strong>{" "}
          {locale === "en"
            ? `up to ${siteConfig.pricing.freeDailyA4Sheets} exported A4 sheet(s) per day.`
            : `jusqu'a ${siteConfig.pricing.freeDailyA4Sheets} planche(s) A4 exportee(s) par jour.`}
        </p>
        <p>
          <strong>{locale === "en" ? "24-hour pass:" : "Pass 24h :"}</strong>{" "}
          {formatEuroFromCents(siteConfig.pricing.dayPassPriceCents, locale)}
          {locale === "en" ? " incl. VAT." : " TTC."}
        </p>
        <p>
          <strong>{locale === "en" ? "Monthly subscription:" : "Abonnement mensuel :"}</strong>{" "}
          {formatEuroFromCents(siteConfig.pricing.monthlyPriceCents, locale)}
          {locale === "en" ? " incl. VAT / month." : " TTC / mois."}
        </p>
        <p>
          <strong>{locale === "en" ? "Annual subscription:" : "Abonnement annuel :"}</strong>{" "}
          {formatEuroFromCents(siteConfig.pricing.annualPriceCents, locale)}
          {locale === "en" ? " incl. VAT / year." : " TTC / an."}
        </p>
        <p>
          {locale === "en"
            ? "Premium plans include ad-free access, unlimited exports during the active period and access to the premium features published on the site."
            : "Les offres premium incluent un acces sans publicite, des exports illimites pendant la duree de validite de l'offre et l'acces aux fonctionnalites premium publiees sur le site."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "3. Payment, renewal and billing" : "3. Paiement, renouvellement et facturation"}
        </h2>
        <p>
          {locale === "en"
            ? "Payments are processed by a specialized payment provider. Subscriptions renew automatically until cancellation. Receipts and invoices are issued by the payment provider according to the service configuration."
            : "Les paiements sont securises par un prestataire specialise. Les abonnements se renouvellent automatiquement a chaque echeance jusqu'a resiliation. Les recus et factures sont emis par le prestataire de paiement selon la configuration du service."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "4. Cancellation" : "4. Resiliation"}
        </h2>
        <p>
          {locale === "en" ? "You can cancel online at any time from the" : "Vous pouvez resilier votre abonnement en ligne a tout moment depuis la page"}{" "}
          <Link href={localizePath("/compte", locale)} className="text-sky-800 hover:underline">
            {locale === "en" ? "My account" : "Mon compte"}
          </Link>
          .{" "}
          {locale === "en"
            ? "Premium access remains active until the end of the period already paid for, unless stated otherwise."
            : "L'acces premium reste actif jusqu'a la fin de la periode deja payee, sauf mention contraire."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "5. Withdrawal right" : "5. Droit de retractation"}
        </h2>
        <p>
          {locale === "en"
            ? "For consumer purchases, the 14-day withdrawal right applies in principle. However, if the user requests immediate activation of the premium service and expressly waives this right, performance starts without waiting for the end of that period."
            : "En cas d'achat par un consommateur, le droit de retractation de 14 jours s'applique en principe. Toutefois, si l'utilisateur demande l'activation immediate du service premium et renonce expressement a son droit de retractation, l'execution demarre sans attendre l'expiration de ce delai."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "6. Refunds" : "6. Remboursement"}
        </h2>
        <p>
          {locale === "en" ? "Refund requests are handled case by case at" : "Les demandes de remboursement sont traitees au cas par cas a l'adresse"}{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "7. Support" : "7. Support"}</h2>
        <p>
          {locale === "en" ? "Support is available at" : "Le support est joignable a"}{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          . {locale === "en" ? "Reply within 2 business days." : siteConfig.supportResponseDelay}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "8. Consumer mediation" : "8. Mediation de la consommation"}
        </h2>
        <p>
          {locale === "en"
            ? `If a dispute is not resolved with support, the consumer customer may contact the following mediator: ${siteConfig.mediator.name}.`
            : `En cas de litige non resolu avec le support, le client consommateur peut recourir au mediateur suivant : ${siteConfig.mediator.name}.`}
        </p>
        <p>
          <strong>{locale === "en" ? "Address:" : "Adresse :"}</strong> {siteConfig.mediator.address}
        </p>
        <p>
          <strong>{locale === "en" ? "Website:" : "Site :"}</strong> {siteConfig.mediator.website}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "9. Liability limitation" : "9. Limitation de responsabilite"}
        </h2>
        <p>
          {locale === "en"
            ? "The service is provided as is. The publisher undertakes to process PDFs with reasonable care, without guaranteeing the absence of errors on every document or every carrier. The user remains responsible for checking the generated sheets before printing and shipping."
            : "Le service est fourni en l'etat. L'editeur s'engage a apporter un soin raisonnable au traitement des PDF, sans garantir l'absence absolue d'erreurs sur tous les documents ou tous les transporteurs. L'utilisateur conserve la responsabilite de verifier ses planches avant impression et expedition."}
        </p>
      </section>
    </PageShell>
  )
}

export function PrivacyPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell
      locale={locale}
      title={locale === "en" ? "Privacy policy" : "Politique de confidentialite"}
      intro=""
    >
      <LegalWarning locale={locale} />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "1. Data processed" : "1. Donnees traitees"}
        </h2>
        <p>
          {locale === "en"
            ? "The site processes uploaded PDF files to produce the requested output, technical identifiers needed for free quotas and abuse prevention, information transmitted by the payment provider, and the minimum support data you send us, including any attachment you choose to add."
            : "Le site traite les fichiers PDF deposes pour produire le resultat demande, les identifiants techniques necessaires au quota gratuit et a la prevention d'abus, les informations transmises par le prestataire de paiement et les donnees minimales de support si vous nous contactez, y compris les pieces jointes que vous choisissez d'ajouter a votre demande."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "2. Purposes" : "2. Finalites"}</h2>
        <p>
          {locale === "en"
            ? "These processing operations are used to provide the service, enforce free limits, manage premium access, answer support requests, secure the platform and log useful diagnostic or anti-abuse events."
            : "Ces traitements servent a fournir le service, appliquer les limites gratuites, gerer les acces premium, repondre aux demandes de support, securiser la plateforme et journaliser les evenements utiles au diagnostic et a la prevention d'abus."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "3. Legal basis" : "3. Base legale"}</h2>
        <p>
          {locale === "en"
            ? "Strictly necessary processing relies on the performance of the requested service. Payments are handled by the payment provider. Audience measurement and conversion events are enabled only if you accept optional trackers through the consent banner."
            : "Les traitements strictement necessaires reposent sur l'execution du service demande. Les paiements sont geres par le prestataire de paiement. La mesure d'audience et les evenements de conversion sont actives uniquement si vous acceptez les traceurs facultatifs via le bandeau prevu a cet effet."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "4. Retention periods" : "4. Durees de conservation"}
        </h2>
        <p>
          {locale === "en"
            ? "PDF files are processed only for the time required to generate the requested output and are not stored by the site afterward."
            : "Les fichiers PDF sont traites uniquement le temps necessaire a la generation du resultat puis ne sont pas conserves par le site."}
        </p>
        <p>
          {locale === "en"
            ? `Technical cookies and access information are kept only for the time strictly necessary to operate the service. Technical logs and minimum quota or anti-abuse data are kept for ${siteConfig.dataHandling.technicalLogRetentionDays} days.`
            : `Les cookies techniques et informations d'acces sont conserves pendant la duree strictement necessaire au fonctionnement du service. Les journaux techniques et donnees minimales liees au quota et a la prevention d'abus sont conserves pendant ${siteConfig.dataHandling.technicalLogRetentionDays} jours.`}
        </p>
        <p>
          {locale === "en"
            ? "Attachments sent to support are used only to handle your request and are not published by the site."
            : "Les pieces jointes envoyees au support servent uniquement au suivi de votre demande et ne sont pas publiees par le site."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {locale === "en" ? "5. Recipients" : "5. Destinataires"}
        </h2>
        <p>
          {locale === "en"
            ? `Payment data necessary to process purchases is handled by a specialized payment provider. Hosting is provided by ${siteConfig.host.name}. Audience measurement is supplied by a consent-aware analytics tool. Support requests may transit through the transactional email provider configured for support. No advertising network is used, and no PDF is sold, shared or stored for marketing purposes.`
            : `Les donnees necessaires au paiement sont traitees par un prestataire specialise. L'hebergement est assure par ${siteConfig.host.name}. La mesure d'audience est fournie par un outil d'analyse respectueux du consentement. Les demandes de support peuvent transiter par le prestataire d'email transactionnel configure pour le support. Aucun reseau publicitaire n'est utilise et aucun PDF n'est revendu, cede ou stocke a des fins marketing.`}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "6. Your rights" : "6. Vos droits"}</h2>
        <p>
          {locale === "en" ? "You can exercise your rights of access, rectification, deletion, objection and restriction at" : "Vous pouvez exercer vos droits d'acces, rectification, effacement, opposition et limitation a l'adresse"}{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>
    </PageShell>
  )
}

export function CookiesPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} title="Cookies" intro="">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Strictly necessary cookies" : "Cookies strictement nécessaires"}</h2>
        <p>
          {locale === "en"
            ? "The site uses technical cookies to remember your anonymous identifier and premium access state. The free quota may also rely on minimal server-side storage so that simply clearing cache or cookies does not reset the daily limit."
            : "Le site utilise des cookies techniques pour mémoriser votre identifiant anonyme et votre état d'accès premium. Le quota gratuit peut aussi s'appuyer sur un stockage serveur minimal afin d'éviter qu'un simple vidage du cache ou des cookies ne réinitialise la limite quotidienne."}
        </p>
      </section>
    </PageShell>
  )
}

export function RefundPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} title={locale === "en" ? "Refund policy" : "Procédure de remboursement"} intro="">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "How do I request a refund?" : "Comment demander un remboursement ?"}</h2>
        <p>
          {locale === "en" ? "Send your request to" : "Envoyez votre demande à"}{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-sky-800 hover:underline">
            {siteConfig.supportEmail}
          </a>{" "}
          {locale === "en"
            ? "and include the email used during payment, the transaction date and the reason for the request."
            : "en indiquant l’email utilisé lors du paiement, la date de transaction et le motif de la demande."}
        </p>
      </section>
    </PageShell>
  )
}

export function CancellationPageContent({ locale }: { locale: Locale }) {
  return (
    <PageShell locale={locale} title={locale === "en" ? "Cancellation" : "Résiliation"} intro="">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{locale === "en" ? "Cancel online" : "Résilier en ligne"}</h2>
        <p className="text-sm leading-6 text-slate-600">
          {locale === "en" ? "Full subscription management is available in" : "La gestion complète de l’abonnement est disponible dans"}{" "}
          <Link href={localizePath("/compte", locale)} className="text-sky-800 hover:underline">
            {locale === "en" ? "My account" : "Mon compte"}
          </Link>
          . {locale === "en" ? "You will find the billing portal button there." : "Vous y retrouverez le bouton d’accès au portail de facturation."}
        </p>
        <BillingPortalButton
          label={locale === "en" ? "Open the cancellation portal" : "Ouvrir le portail de résiliation"}
          locale={locale}
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        />
      </section>
    </PageShell>
  )
}
