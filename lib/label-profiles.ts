export type HorizontalCropSide = "left" | "right"
export type VerticalCropSide = "top" | "bottom"

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
}

export interface ManualLabelProfile extends BaseLabelProfile {
  mode: "manual"
}

export type LabelProfile = PresetLabelProfile | ManualLabelProfile

export const LABEL_PROFILES = [
  {
    id: "chronopost",
    slug: "chronopost",
    title: "Chronopost",
    shortLabel: "Chronopost",
    mode: "preset",
    crop: {
      side: "right",
      portion: 0.4,
    },
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
    crop: {
      side: "left",
      portion: 0.54,
      verticalSide: "top",
      verticalPortion: 0.4,
    },
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
