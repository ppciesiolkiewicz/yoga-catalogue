import type { Tag } from "@/data/types"

const STYLE_CONFIG: Record<string, { pill: string; emoji: string }> = {
  Ashtanga: {
    pill: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    emoji: "🔥",
  },
  Vinyasa: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    emoji: "🌊",
  },
  Hatha: {
    pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    emoji: "☀️",
  },
  Yin: {
    pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    emoji: "🌙",
  },
  Kundalini: {
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    emoji: "⚡",
  },
  Aerial: {
    pill: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    emoji: "🦋",
  },
  Retreat: {
    pill: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    emoji: "🏔️",
  },
  Meditation: {
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    emoji: "🧘",
  },
  "Sound Healing": {
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    emoji: "🔔",
  },
  Breathwork: {
    pill: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
    emoji: "🌬️",
  },
  Nidra: {
    pill: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300",
    emoji: "💤",
  },
  Acroyoga: {
    pill: "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300",
    emoji: "🤸",
  },
  "Multi-Style TTC": {
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    emoji: "🕉️",
  },
  Yoga: {
    pill: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    emoji: "🧘",
  },
}

const DEFAULT_STYLE = {
  pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  emoji: "📿",
}

export function getStyleConfig(label: string) {
  return STYLE_CONFIG[label] ?? DEFAULT_STYLE
}

/** Full style config including border/bg for cards */
export const CARD_STYLE_CONFIG: Record<string, { pill: string; border: string; bg: string; check: string; emoji: string }> = {
  Ashtanga: { ...STYLE_CONFIG.Ashtanga, border: "border-l-orange-500", bg: "from-orange-50 dark:from-orange-950/20", check: "accent-orange-500" },
  Vinyasa: { ...STYLE_CONFIG.Vinyasa, border: "border-l-amber-500", bg: "from-amber-50 dark:from-amber-950/20", check: "accent-amber-500" },
  Hatha: { ...STYLE_CONFIG.Hatha, border: "border-l-red-400", bg: "from-red-50 dark:from-red-950/20", check: "accent-red-500" },
  Yin: { ...STYLE_CONFIG.Yin, border: "border-l-purple-500", bg: "from-purple-50 dark:from-purple-950/20", check: "accent-purple-500" },
  Kundalini: { ...STYLE_CONFIG.Kundalini, border: "border-l-yellow-500", bg: "from-yellow-50 dark:from-yellow-950/20", check: "accent-yellow-500" },
  Aerial: { ...STYLE_CONFIG.Aerial, border: "border-l-pink-500", bg: "from-pink-50 dark:from-pink-950/20", check: "accent-pink-500" },
  Retreat: { ...STYLE_CONFIG.Retreat, border: "border-l-teal-500", bg: "from-teal-50 dark:from-teal-950/20", check: "accent-teal-500" },
  Meditation: { ...STYLE_CONFIG.Meditation, border: "border-l-indigo-500", bg: "from-indigo-50 dark:from-indigo-950/20", check: "accent-indigo-500" },
  "Sound Healing": { ...STYLE_CONFIG["Sound Healing"], border: "border-l-rose-500", bg: "from-rose-50 dark:from-rose-950/20", check: "accent-rose-500" },
  Breathwork: { ...STYLE_CONFIG.Breathwork, border: "border-l-cyan-500", bg: "from-cyan-50 dark:from-cyan-950/20", check: "accent-cyan-500" },
  Nidra: { ...STYLE_CONFIG.Nidra, border: "border-l-violet-500", bg: "from-violet-50 dark:from-violet-950/20", check: "accent-violet-500" },
  Acroyoga: { ...STYLE_CONFIG.Acroyoga, border: "border-l-lime-500", bg: "from-lime-50 dark:from-lime-950/20", check: "accent-lime-500" },
  "Multi-Style TTC": { ...STYLE_CONFIG["Multi-Style TTC"], border: "border-l-sky-500", bg: "from-sky-50 dark:from-sky-950/20", check: "accent-sky-500" },
  Yoga: { ...STYLE_CONFIG.Yoga, border: "border-l-emerald-500", bg: "from-emerald-50 dark:from-emerald-950/20", check: "accent-emerald-500" },
}

const DEFAULT_CARD_STYLE = {
  pill: DEFAULT_STYLE.pill,
  border: "border-l-zinc-400",
  bg: "",
  check: "accent-zinc-500",
  emoji: DEFAULT_STYLE.emoji,
}

export function getCardStyle(label: string) {
  return CARD_STYLE_CONFIG[label] ?? DEFAULT_CARD_STYLE
}

export function getDurationPill(label: string): string {
  if (label.endsWith("h")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
  }
  const days = parseInt(label, 10)
  if (days <= 7) return "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300"
  if (days <= 14) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300"
  if (days <= 30) return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300"
  return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300"
}

export function getStyleTag(tags: Tag[]): string {
  const style = tags.find((t) => t.category === "style")
  return style?.label ?? "Other"
}

/** Static display pill on cards */
export function TagPill({ tag }: { tag: Tag }) {
  const styleConfig = tag.category === "style"
    ? getStyleConfig(tag.label).pill
    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styleConfig}`}>
      {tag.label}
    </span>
  )
}
