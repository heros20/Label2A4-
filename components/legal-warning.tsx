import { getMissingPublicConfigurationItems } from "@/lib/site-config"

export function LegalWarning() {
  const missingItems = getMissingPublicConfigurationItems()

  if (missingItems.length === 0) {
    return null
  }

  return (
    <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
      Certaines informations publiques doivent encore être complétées avant mise en production:
      {" "}
      {missingItems.join(", ")}.
    </div>
  )
}
