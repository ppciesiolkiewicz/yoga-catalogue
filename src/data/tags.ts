import type { YogaCourse, Tag, DropInClass } from "./types"

/** Derive style tags from the course type string */
function getStyleTags(type: string): string[] {
  const t = type.toLowerCase()
  const tags: string[] = []
  if (t.includes("aerial")) tags.push("Aerial")
  if (t.includes("kundalini")) tags.push("Kundalini")
  if (t.includes("yin")) tags.push("Yin")
  if (t.includes("ashtanga")) tags.push("Ashtanga")
  if (t.includes("vinyasa")) tags.push("Vinyasa")
  if (t.includes("hatha")) tags.push("Hatha")
  if (t.includes("retreat")) tags.push("Retreat")
  if (t.includes("sound healing")) tags.push("Sound Healing")
  if (t.includes("meditation")) tags.push("Meditation")
  if (tags.length === 0) {
    if (t.includes("yoga") || t.includes("ytt") || t.includes("teacher training") || t.includes("200") || t.includes("300") || t.includes("500")) tags.push("Multi-Style TTC")
    else tags.push("Yoga")
  }
  return tags
}

/** Generate all tags for a course from its fields */
export function generateTags(course: Pick<YogaCourse, "type" | "certificationLevel" | "durationDays">): Tag[] {
  const tags: Tag[] = []

  for (const label of getStyleTags(course.type)) {
    tags.push({ label, category: "style" })
  }

  const hourMatch = course.certificationLevel.match(/(\d+)\s*hr/)
  if (hourMatch) {
    tags.push({ label: `${hourMatch[1]}h`, category: "certification" })
  }

  if (course.durationDays > 0) {
    tags.push({ label: `${course.durationDays} days`, category: "duration" })
  }

  return tags
}

/** Generate tags for a drop-in class (style only) */
export function generateDropInTags(dropIn: Pick<DropInClass, "style">): Tag[] {
  const tags: Tag[] = []
  for (const label of getStyleTags(dropIn.style)) {
    tags.push({ label, category: "style" })
  }
  return tags
}
