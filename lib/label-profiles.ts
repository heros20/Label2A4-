export type HorizontalCropSide = "left" | "right"
export type VerticalCropSide = "top" | "bottom"

export interface LabelCropRule {
  side: HorizontalCropSide
  portion: number
  verticalSide?: VerticalCropSide
  verticalPortion?: number
}

export interface LabelProfile {
  id: string
  slug: string
  title: string
  shortLabel: string
  description: string
  badge: string
  crop: LabelCropRule
}

export const LABEL_PROFILES = [
  {
    id: "chronopost",
    slug: "chronopost",
    title: "Rognage Chronopost",
    shortLabel: "Chronopost",
    description: "Conserve les 40% de droite uniquement.",
    badge: "40% droite",
    crop: {
      side: "right",
      portion: 0.4,
    },
  },
  {
    id: "vinted",
    slug: "vinted",
    title: "Rognage Vinted",
    shortLabel: "Vinted",
    description: "Conserve les 54% de gauche et les 40% du haut.",
    badge: "54% gauche + haut 40%",
    crop: {
      side: "left",
      portion: 0.54,
      verticalSide: "top",
      verticalPortion: 0.4,
    },
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
