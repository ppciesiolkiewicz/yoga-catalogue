"use client"

import { useState, useMemo } from "react"
import type { YogaCourse } from "@/data/types"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getMonthKey(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-")
  return `${MONTHS[parseInt(month, 10) - 1]} ${year}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatPrice(price: { amount: number; currency: string }) {
  if (price.amount === 0) return "Contact for price"
  return `${price.currency} ${price.amount.toLocaleString()}`
}

function formatAccommodation(val: boolean | string) {
  if (val === true) return "Included"
  if (val === false) return "Not included"
  return String(val).replace(/^string - /i, "")
}

// Yoga style categories:
// Yang (warm/active): Ashtanga, Vinyasa, Hatha — often combined in multi-style TTC
// Yin (cool/passive): Yin yoga
// Specialty: Kundalini, Aerial
// Experience: Retreat, Meditation, Sound Healing
function getTypes(type: string): string[] {
  const t = type.toLowerCase()
  const types: string[] = []
  if (t.includes("aerial")) types.push("Aerial")
  if (t.includes("kundalini")) types.push("Kundalini")
  if (t.includes("yin")) types.push("Yin")
  if (t.includes("ashtanga")) types.push("Ashtanga")
  if (t.includes("vinyasa")) types.push("Vinyasa")
  if (t.includes("hatha")) types.push("Hatha")
  if (t.includes("retreat")) types.push("Retreat")
  if (t.includes("sound healing")) types.push("Sound Healing")
  if (t.includes("meditation")) types.push("Meditation")
  if (types.length === 0) {
    if (t.includes("200") || t.includes("300") || t.includes("500")) types.push("Multi-Style TTC")
    else types.push("Other")
  }
  return types
}

// Style config: colors reflect the energy of each style
// Yang styles = warm tones (orange, amber, red)
// Yin = cool purple
// Specialty = distinctive colors
// Retreats = earthy teal
const STYLE_CONFIG: Record<string, { pill: string; border: string; card: string; emoji: string }> = {
  Ashtanga: {
    pill: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    border: "border-l-orange-500",
    card: "bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-zinc-900",
    emoji: "🔥",
  },
  Vinyasa: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    border: "border-l-amber-500",
    card: "bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-zinc-900",
    emoji: "🌊",
  },
  Hatha: {
    pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    border: "border-l-red-400",
    card: "bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-zinc-900",
    emoji: "☀️",
  },
  Yin: {
    pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    border: "border-l-purple-500",
    card: "bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-zinc-900",
    emoji: "🌙",
  },
  Kundalini: {
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    border: "border-l-yellow-500",
    card: "bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-950/20 dark:to-zinc-900",
    emoji: "⚡",
  },
  Aerial: {
    pill: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    border: "border-l-pink-500",
    card: "bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/20 dark:to-zinc-900",
    emoji: "🦋",
  },
  Retreat: {
    pill: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    border: "border-l-teal-500",
    card: "bg-gradient-to-r from-teal-50 to-white dark:from-teal-950/20 dark:to-zinc-900",
    emoji: "🏔️",
  },
  Meditation: {
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    border: "border-l-indigo-500",
    card: "bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/20 dark:to-zinc-900",
    emoji: "🧘",
  },
  "Sound Healing": {
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    border: "border-l-rose-500",
    card: "bg-gradient-to-r from-rose-50 to-white dark:from-rose-950/20 dark:to-zinc-900",
    emoji: "🔔",
  },
  "Multi-Style TTC": {
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    border: "border-l-sky-500",
    card: "bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/20 dark:to-zinc-900",
    emoji: "🕉️",
  },
  Other: {
    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    border: "border-l-zinc-400",
    card: "bg-white dark:bg-zinc-900",
    emoji: "📿",
  },
}

const DEFAULT_STYLE = STYLE_CONFIG.Other

function getStyle(type: string) {
  return STYLE_CONFIG[type] ?? DEFAULT_STYLE
}

function sortByDate(courses: YogaCourse[]) {
  return [...courses].sort((a, b) => {
    const dateA = a.upcomingDates[0] ?? "9999"
    const dateB = b.upcomingDates[0] ?? "9999"
    return dateA.localeCompare(dateB)
  })
}

function CourseCard({ course }: { course: YogaCourse }) {
  const primaryType = getTypes(course.type)[0]
  const style = getStyle(primaryType)

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-zinc-200 border-l-4 ${style.border} ${style.card} p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img">{style.emoji}</span>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {course.courseName}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {course.schoolName}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
          {formatPrice(course.price)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {course.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {getTypes(course.type).map((t) => (
          <span
            key={t}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStyle(t).pill}`}
          >
            {t}
          </span>
        ))}
        {course.certificationLevel && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {course.certificationLevel}
          </span>
        )}
        {course.durationDays > 0 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {course.durationDays} days
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-zinc-500 dark:text-zinc-400 sm:grid-cols-2">
        {course.accommodation && (
          <div>
            <span className="font-medium">Accommodation:</span>{" "}
            {formatAccommodation(course.accommodation)}
          </div>
        )}
        {course.meals && (
          <div>
            <span className="font-medium">Meals:</span>{" "}
            {formatAccommodation(course.meals)}
          </div>
        )}
        {course.upcomingDates.length > 0 && (
          <div className="sm:col-span-2">
            <span className="font-medium">Starts:</span>{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {course.upcomingDates.map(formatDate).join(", ")}
            </span>
          </div>
        )}
      </div>
    </a>
  )
}

export function CourseList({ courses }: { courses: YogaCourse[] }) {
  // Extract all unique types, ordered by popularity (most courses first)
  const allTypes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const course of courses) {
      for (const t of getTypes(course.type)) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)
  }, [courses])

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(allTypes)
  )

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  function toggleAll() {
    if (selectedTypes.size === allTypes.length) {
      setSelectedTypes(new Set())
    } else {
      setSelectedTypes(new Set(allTypes))
    }
  }

  // Filter courses by selected types (a course matches if any of its types is selected)
  const filtered = useMemo(
    () => courses.filter((c) => getTypes(c.type).some((t) => selectedTypes.has(t))),
    [courses, selectedTypes]
  )

  const { monthKeys, coursesByMonth, undatedCourses } = useMemo(() => {
    // Only show previous month and onwards
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`

    const byMonth = new Map<string, YogaCourse[]>()
    const undated: YogaCourse[] = []

    for (const course of filtered) {
      if (course.upcomingDates.length === 0) {
        undated.push(course)
        continue
      }
      for (const date of course.upcomingDates) {
        const key = getMonthKey(date)
        if (key < cutoffKey) continue
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key)!.push({ ...course, upcomingDates: [date] })
      }
    }

    for (const [, list] of byMonth) {
      list.splice(0, list.length, ...sortByDate(list))
    }

    const keys = [...byMonth.keys()].sort()
    return {
      monthKeys: keys,
      coursesByMonth: byMonth,
      undatedCourses: sortByDate(undated),
    }
  }, [filtered])

  const allTabs = [...monthKeys, ...(undatedCourses.length > 0 ? ["undated"] : [])]
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const defaultTab = monthKeys.includes(currentMonthKey) ? currentMonthKey : allTabs[0] ?? "undated"
  const [activeTab, setActiveTab] = useState(defaultTab)

  const displayedCourses =
    activeTab === "undated"
      ? undatedCourses
      : coursesByMonth.get(activeTab) ?? []

  return (
    <div>
      {/* Type filter pills */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleAll}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
            selectedTypes.size === allTypes.length
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
        >
          All
        </button>
        {allTypes.map((type) => {
          const style = getStyle(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${style.pill} ${
                selectedTypes.has(type) ? "opacity-100 shadow-sm" : "opacity-30"
              }`}
            >
              {style.emoji} {type}
            </button>
          )
        })}
      </div>

      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {monthKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
            }`}
          >
            {formatMonthLabel(key)}
            <span className="ml-1.5 text-xs opacity-70">
              ({coursesByMonth.get(key)?.length ?? 0})
            </span>
          </button>
        ))}
        {undatedCourses.length > 0 && (
          <button
            onClick={() => setActiveTab("undated")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "undated"
                ? "bg-zinc-700 text-white shadow-md dark:bg-zinc-300 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Dates TBD
            <span className="ml-1.5 text-xs opacity-60">
              ({undatedCourses.length})
            </span>
          </button>
        )}
      </div>

      {/* Course cards */}
      <div className="mt-4 flex flex-col gap-3">
        {displayedCourses.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            No courses match your filters.
          </p>
        ) : (
          displayedCourses.map((course, i) => (
            <CourseCard key={`${course.url}-${i}`} course={course} />
          ))
        )}
      </div>
    </div>
  )
}
