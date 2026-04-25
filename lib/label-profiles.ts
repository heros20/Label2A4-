export type HorizontalCropSide = "left" | "right"
export type VerticalCropSide = "top" | "bottom"
export type LabelRotation = 0 | 90 | 180 | 270

export interface LabelCropRule {
  side: HorizontalCropSide
  portion: number
  verticalSide?: VerticalCropSide
  verticalPortion?: number
}

export interface ManualCropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface PresetCropRectVariant {
  id: string
  slug: string
  title: string
  shortLabel: string
  description: string
  crop?: LabelCropRule
  cropRect?: ManualCropRect
  defaultRotation?: LabelRotation
}

export const DEFAULT_MANUAL_CROP_RECT: ManualCropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}

interface BaseLabelProfile {
  id: string
  slug: string
  title: string
  shortLabel: string
}

export interface PresetLabelProfile extends BaseLabelProfile {
  mode: "preset"
  crop?: LabelCropRule
  cropRect?: ManualCropRect
  defaultRotation?: LabelRotation
}

export interface ManualLabelProfile extends BaseLabelProfile {
  mode: "manual"
}

export type LabelProfile = PresetLabelProfile | ManualLabelProfile

export const CHRONOPOST_VARIANTS = [
  {
    id: "standard",
    slug: "standard",
    title: "Standard",
    shortLabel: "Standard",
    description: "",
    crop: {
      side: "right",
      portion: 0.4,
    },
  },
  {
    id: "temu",
    slug: "variante-temu",
    title: "Variante Temu",
    shortLabel: "Temu",
    description: "",
    cropRect: {
      x: 0.29,
      y: 0.03,
      width: 0.43,
      height: 0.18,
    },
    defaultRotation: 90,
  },
] as const satisfies readonly PresetCropRectVariant[]

export type ChronopostVariantId = (typeof CHRONOPOST_VARIANTS)[number]["id"]
export const DEFAULT_CHRONOPOST_VARIANT_ID: ChronopostVariantId = CHRONOPOST_VARIANTS[0].id

export const MONDIAL_RELAY_VARIANTS = [
  {
    id: "variant-1",
    slug: "variante-1",
    title: "Variante 1",
    shortLabel: "V1",
    description: "Découpe principale",
    cropRect: {
      x: 0,
      y: 0,
      width: 0.53,
      height: 0.56,
    },
  },
  {
    id: "variant-2",
    slug: "variante-2",
    title: "Variante 2",
    shortLabel: "V2",
    description: "Découpe alternative",
    cropRect: {
      x: 0.12,
      y: 0.6,
      width: 0.77,
      height: 0.38,
    },
    defaultRotation: 270,
  },
] as const satisfies readonly PresetCropRectVariant[]

export type MondialRelayVariantId = (typeof MONDIAL_RELAY_VARIANTS)[number]["id"]
export const DEFAULT_MONDIAL_RELAY_VARIANT_ID: MondialRelayVariantId = MONDIAL_RELAY_VARIANTS[0].id

export const LABEL_PROFILES = [
  {
    id: "chronopost",
    slug: "chronopost",
    title: "Chronopost",
    shortLabel: "Chronopost",
    mode: "preset",
    crop: CHRONOPOST_VARIANTS[0].crop,
  },
  {
    id: "colissimo",
    slug: "colissimo",
    title: "Colissimo",
    shortLabel: "Colissimo",
    mode: "preset",
    cropRect: {
      x: 0.08,
      y: 0.32,
      width: 0.36,
      height: 0.29,
    },
  },
  {
    id: "mondial-relay",
    slug: "mondial-relay",
    title: "Mondial Relay",
    shortLabel: "Mondial Relay",
    mode: "preset",
    cropRect: MONDIAL_RELAY_VARIANTS[0].cropRect,
  },
  {
    id: "happy-post",
    slug: "happy-post",
    title: "Happy Post",
    shortLabel: "Happy Post",
    mode: "preset",
    cropRect: {
      x: 0.08,
      y: 0.05,
      width: 0.84,
      height: 0.41,
    },
    defaultRotation: 90,
  },
  {
    id: "manual",
    slug: "manuel",
    title: "Rognage manuel",
    shortLabel: "Manuel",
    mode: "manual",
  },
] as const satisfies readonly LabelProfile[]

export type LabelProfileId = (typeof LABEL_PROFILES)[number]["id"]

export const LABEL_PROFILE_MAP: Record<LabelProfileId, (typeof LABEL_PROFILES)[number]> =
  Object.fromEntries(LABEL_PROFILES.map((profile) => [profile.id, profile])) as Record<
    LabelProfileId,
    (typeof LABEL_PROFILES)[number]
  >

export function getLabelProfile(profileId: LabelProfileId) {
  return LABEL_PROFILE_MAP[profileId]
}

export function getChronopostVariant(
  variantId: ChronopostVariantId = DEFAULT_CHRONOPOST_VARIANT_ID,
): PresetCropRectVariant {
  return CHRONOPOST_VARIANTS.find((variant) => variant.id === variantId) ?? CHRONOPOST_VARIANTS[0]
}

export function getMondialRelayVariant(
  variantId: MondialRelayVariantId = DEFAULT_MONDIAL_RELAY_VARIANT_ID,
): PresetCropRectVariant {
  return (
    MONDIAL_RELAY_VARIANTS.find((variant) => variant.id === variantId) ?? MONDIAL_RELAY_VARIANTS[0]
  )
}

export function getResolvedLabelProfile(
  profileId: LabelProfileId,
  options: {
    chronopostVariantId?: ChronopostVariantId
    mondialRelayVariantId?: MondialRelayVariantId
  } = {},
): LabelProfile {
  const profile = getLabelProfile(profileId)

  if (profile.id === "chronopost") {
    const variant = getChronopostVariant(options.chronopostVariantId)

    return {
      ...profile,
      slug: `${profile.slug}-${variant.slug}`,
      shortLabel: `${profile.shortLabel} ${variant.shortLabel}`,
      crop: variant.crop,
      cropRect: variant.cropRect,
      defaultRotation: variant.defaultRotation,
    }
  }

  if (profile.id === "mondial-relay") {
    const variant = getMondialRelayVariant(options.mondialRelayVariantId)

    return {
      ...profile,
      slug: `${profile.slug}-${variant.slug}`,
      shortLabel: `${profile.shortLabel} ${variant.shortLabel}`,
      crop: variant.crop,
      cropRect: variant.cropRect,
      defaultRotation: variant.defaultRotation,
    }
  }

  return profile
}
