import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

interface SiteLogoProps {
  className?: string
  markClassName?: string
  textClassName?: string
}

export function SiteLogo({ className, markClassName, textClassName }: SiteLogoProps) {
  return (
    <Link
      href="/"
      aria-label={`Accueil ${siteConfig.siteName}`}
      className={cn("inline-flex w-fit items-center gap-2.5", className)}
    >
      <span
        className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm", markClassName)}
      >
        <img
          src={siteConfig.brand.logoMarkPng}
          alt=""
          className="h-full w-full rounded-lg object-contain"
        />
      </span>
      <span className={cn("text-xl font-semibold tracking-tight text-slate-950", textClassName)}>
        {siteConfig.siteName}
      </span>
    </Link>
  )
}
