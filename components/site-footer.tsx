import Image from "next/image"
import Link from "next/link"
import { SiteLogo } from "@/components/site-logo"
import { localizePath, type Locale } from "@/lib/i18n"
import { getSiteText } from "@/lib/site-copy"
import { siteConfig } from "@/lib/site-config"

export function SiteFooter({ locale }: { locale: Locale }) {
  const siteText = getSiteText(locale)
  const footerLinkGroups = [
    {
      title: locale === "en" ? "Tool" : "Outil",
      links: [
        { href: "/#outil", label: locale === "en" ? "Optimize a PDF" : "Optimiser un PDF" },
        { href: "/landing", label: locale === "en" ? "A4 printing guide" : "Guide d’impression A4" },
        { href: "/economies#simulateur", label: locale === "en" ? "Savings calculator" : "Calcul des économies" },
      ],
    },
    {
      title: locale === "en" ? "Carriers" : "Transporteurs",
      links: [
        { href: "/mondial-relay", label: "Mondial Relay" },
        { href: "/colissimo", label: "Colissimo" },
        { href: "/chronopost", label: "Chronopost" },
        { href: "/happy-post", label: "Happy Post" },
      ],
    },
    {
      title: locale === "en" ? "Sellers" : "Vendeurs",
      links: [
        { href: "/vinted", label: "Vinted" },
        { href: "/leboncoin", label: "Leboncoin" },
        { href: "/entreprises", label: locale === "en" ? "Businesses" : "Entreprises" },
      ],
    },
    {
      title: locale === "en" ? "Account" : "Compte",
      links: [
        { href: "/tarifs", label: locale === "en" ? "Pricing" : "Tarifs" },
        { href: "/compte", label: locale === "en" ? "My account" : "Mon compte" },
        { href: "/faq", label: "FAQ" },
        { href: "/contact", label: locale === "en" ? "Support" : "Support" },
      ],
    },
    {
      title: locale === "en" ? "Legal" : "Légal",
      links: [
        { href: "/mentions-legales", label: locale === "en" ? "Legal notice" : "Mentions légales" },
        { href: "/cgv", label: "CGV" },
        { href: "/confidentialite", label: locale === "en" ? "Privacy" : "Confidentialité" },
        { href: "/cookies", label: "Cookies" },
        { href: "/resiliation", label: locale === "en" ? "Cancellation" : "Résiliation" },
      ],
    },
  ] as const

  return (
    <footer className="border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(280px,0.75fr)_1.25fr] xl:items-start">
          <div className="max-w-xl">
            <SiteLogo markClassName="h-11 w-11" textClassName="text-2xl" />
            <p className="mt-2 text-sm leading-6 text-slate-600">{siteText.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              {locale === "en" ? "Support contact:" : "Contact support:"}{" "}
              <a className="font-medium text-sky-800 hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav
            aria-label={locale === "en" ? "Footer navigation" : "Navigation de pied de page"}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5"
          >
            {footerLinkGroups.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-950">{group.title}</div>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={localizePath(link.href, locale)}
                        className="text-sm leading-5 text-slate-600 transition hover:text-sky-800 hover:underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} {siteConfig.siteName}.{" "}
            {locale === "en" ? "All rights reserved." : "Tous droits réservés."}
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <a
              href="https://heros20.github.io/Portfolio-2.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-2 text-slate-600 transition hover:border-sky-200 hover:text-sky-800"
            >
              <Image
                src="/images/android-chrome-512x512.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-md"
              />
              <span>{locale === "en" ? "Website created by KB" : "Site créé par KB"}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
