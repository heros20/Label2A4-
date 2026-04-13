import { LegalWarning } from "@/components/legal-warning"
import { PageShell } from "@/components/page-shell"
import { siteConfig } from "@/lib/site-config"

export const metadata = {
  title: "Mentions légales",
}

export default function MentionsLegalesPage() {
  return (
    <PageShell
      title="Mentions légales"
      intro="Ces informations sont publiées pour identifier l’exploitant du site, l’hébergeur et les principales mentions réglementaires."
    >
      <LegalWarning />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Éditeur du site</h2>
        <p><strong>Nom du site :</strong> {siteConfig.siteName}</p>
        <p><strong>Exploitant :</strong> {siteConfig.business.businessName}</p>
        <p><strong>Responsable :</strong> {siteConfig.business.ownerName}</p>
        <p><strong>Forme juridique :</strong> {siteConfig.business.legalForm}</p>
        <p><strong>Micro-entreprise :</strong> {siteConfig.business.microEnterpriseStatus}</p>
        <p><strong>Adresse :</strong> {siteConfig.business.address}</p>
        <p><strong>SIREN :</strong> {siteConfig.business.siren}</p>
        <p><strong>SIRET :</strong> {siteConfig.business.siret}</p>
        <p><strong>TVA intracommunautaire :</strong> {siteConfig.business.vatNumber}</p>
        <p><strong>Inscription au RCS :</strong> {siteConfig.business.rcsStatus}</p>
        <p><strong>Inscription au RNE :</strong> {siteConfig.business.rneStatus}</p>
        <p><strong>Email :</strong> {siteConfig.supportEmail}</p>
        <p><strong>Directeur de la publication :</strong> {siteConfig.business.publicationDirector}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Hébergement</h2>
        <p><strong>Hébergeur :</strong> {siteConfig.host.name}</p>
        <p><strong>Adresse :</strong> {siteConfig.host.address}</p>
        <p><strong>Site :</strong> {siteConfig.host.website}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Médiation de la consommation</h2>
        <p><strong>Médiateur :</strong> {siteConfig.mediator.name}</p>
        <p><strong>Adresse :</strong> {siteConfig.mediator.address}</p>
        <p><strong>Site :</strong> {siteConfig.mediator.website}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">Propriété intellectuelle</h2>
        <p>
          L’ensemble des éléments du site {siteConfig.siteName}, y compris le code, les textes, visuels, mises en page
          et bases documentaires, est protégé par le droit de la propriété intellectuelle. Toute reproduction,
          représentation ou exploitation sans autorisation écrite préalable est interdite.
        </p>
      </section>
    </PageShell>
  )
}
