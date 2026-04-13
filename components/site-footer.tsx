import Link from "next/link"
import { siteConfig } from "@/lib/site-config"

const footerLinks = [
  { href: "/tarifs", label: "Tarifs" },
  { href: "/compte", label: "Mon compte" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Support" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgv", label: "CGV" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/cookies", label: "Cookies" },
  { href: "/resiliation", label: "Résiliation" },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/55 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-2xl">
            <div className="text-lg font-semibold text-slate-950">{siteConfig.siteName}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{siteConfig.description}</p>
            <p className="mt-3 text-sm text-slate-500">
              Contact support:{" "}
              <a className="font-medium text-sky-800 hover:underline" href={`mailto:${siteConfig.supportEmail}`}>
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-600 sm:grid-cols-5">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-sky-800 hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
