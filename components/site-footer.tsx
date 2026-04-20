import Link from "next/link"
import { siteConfig } from "@/lib/site-config"

const footerLinkGroups = [
  {
    title: "Outil",
    links: [
      { href: "/#outil", label: "Optimiser un PDF" },
      { href: "/landing", label: "Guide d’impression A4" },
      { href: "/economies#simulateur", label: "Calcul des économies" },
    ],
  },
  {
    title: "Transporteurs",
    links: [
      { href: "/mondial-relay", label: "Mondial Relay" },
      { href: "/colissimo", label: "Colissimo" },
      { href: "/chronopost", label: "Chronopost" },
    ],
  },
  {
    title: "Vendeurs",
    links: [
      { href: "/vinted", label: "Vinted" },
      { href: "/leboncoin", label: "Leboncoin" },
      { href: "/entreprises", label: "Entreprises" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/tarifs", label: "Tarifs" },
      { href: "/compte", label: "Mon compte" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Support" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/cgv", label: "CGV" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/cookies", label: "Cookies" },
      { href: "/resiliation", label: "Résiliation" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(280px,0.75fr)_1.25fr] xl:items-start">
          <div className="max-w-xl">
            <div className="text-lg font-semibold text-slate-950">{siteConfig.siteName}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{siteConfig.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              Contact support:{" "}
              <a className="font-medium text-sky-800 hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Navigation de pied de page" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {footerLinkGroups.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-950">{group.title}</div>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
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

        <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} {siteConfig.siteName}. Tous droits réservés.
          </div>
          <div>
            {siteConfig.business.businessName} · {siteConfig.business.siret}
          </div>
        </div>
      </div>
    </footer>
  )
}
