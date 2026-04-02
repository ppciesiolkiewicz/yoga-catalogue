"use client"

import { useState, useMemo, useEffect } from "react"
import type { YogaCourse, Location, Tag } from "@/data/types"
import { ThemeToggle } from "./theme-toggle"

const LOCATIONS: { id: Location; label: string; subtitle: string }[] = [
  { id: "Rishikesh", label: "Rishikesh", subtitle: "Uttarakhand, India" },
  { id: "Dharamshala", label: "Dharamshala", subtitle: "Himachal Pradesh, India" },
]

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

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatDateGroupLabel(date: string) {
  const d = new Date(date)
  return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}`
}

function groupByDate(courses: YogaCourse[]) {
  const groups: { date: string; courses: YogaCourse[] }[] = []
  const map = new Map<string, YogaCourse[]>()
  for (const course of courses) {
    const key = course.upcomingDates[0] ?? "undated"
    if (!map.has(key)) {
      const list: YogaCourse[] = []
      map.set(key, list)
      groups.push({ date: key, courses: list })
    }
    map.get(key)!.push(course)
  }
  return groups
}

function formatPrice(price: { amount: number; currency: string }) {
  if (price.amount === 0) return "Contact"
  return `${price.currency} ${price.amount.toLocaleString()}`
}

function formatDetail(val: boolean | string) {
  if (val === true || val === "true") return "Included"
  if (val === false || val === "false") return "Not included"
  return String(val).replace(/^string - /i, "")
}

function getDurationPill(label: string): string {
  if (label.endsWith("h")) {
    // Certification hours — blue shades
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
  }
  // Duration days — warm shades by length
  const days = parseInt(label, 10)
  if (days <= 7) return "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300"
  if (days <= 14) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300"
  if (days <= 30) return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300"
  return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300"
}

function getStyleTag(tags: Tag[]): string {
  const style = tags.find((t) => t.category === "style")
  return style?.label ?? "Other"
}

const STYLE_CONFIG: Record<string, { pill: string; border: string; bg: string; check: string; emoji: string }> = {
  Ashtanga: {
    pill: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    border: "border-l-orange-500",
    bg: "from-orange-50 dark:from-orange-950/20",
    check: "accent-orange-500",
    emoji: "🔥",
  },
  Vinyasa: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    border: "border-l-amber-500",
    bg: "from-amber-50 dark:from-amber-950/20",
    check: "accent-amber-500",
    emoji: "🌊",
  },
  Hatha: {
    pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    border: "border-l-red-400",
    bg: "from-red-50 dark:from-red-950/20",
    check: "accent-red-500",
    emoji: "☀️",
  },
  Yin: {
    pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    border: "border-l-purple-500",
    bg: "from-purple-50 dark:from-purple-950/20",
    check: "accent-purple-500",
    emoji: "🌙",
  },
  Kundalini: {
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    border: "border-l-yellow-500",
    bg: "from-yellow-50 dark:from-yellow-950/20",
    check: "accent-yellow-500",
    emoji: "⚡",
  },
  Aerial: {
    pill: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    border: "border-l-pink-500",
    bg: "from-pink-50 dark:from-pink-950/20",
    check: "accent-pink-500",
    emoji: "🦋",
  },
  Retreat: {
    pill: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    border: "border-l-teal-500",
    bg: "from-teal-50 dark:from-teal-950/20",
    check: "accent-teal-500",
    emoji: "🏔️",
  },
  Meditation: {
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    border: "border-l-indigo-500",
    bg: "from-indigo-50 dark:from-indigo-950/20",
    check: "accent-indigo-500",
    emoji: "🧘",
  },
  "Sound Healing": {
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    border: "border-l-rose-500",
    bg: "from-rose-50 dark:from-rose-950/20",
    check: "accent-rose-500",
    emoji: "🔔",
  },
  "Multi-Style TTC": {
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    border: "border-l-sky-500",
    bg: "from-sky-50 dark:from-sky-950/20",
    check: "accent-sky-500",
    emoji: "🕉️",
  },
  Yoga: {
    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    border: "border-l-zinc-400",
    bg: "",
    check: "accent-zinc-500",
    emoji: "🧘",
  },
}

const DEFAULT_STYLE = {
  pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  border: "border-l-zinc-400",
  bg: "",
  check: "accent-zinc-500",
  emoji: "📿",
}

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
  const primaryType = getStyleTag(course.tags)
  const style = getStyle(primaryType)

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-zinc-200 border-l-4 ${style.border} bg-gradient-to-r ${style.bg} to-white transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:to-zinc-900`}
    >
      <div className="flex">
        {/* Date column */}
        {course.upcomingDates.length > 0 && (
          <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-zinc-200 px-2 py-4 dark:border-zinc-800 sm:w-24">
            <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 sm:text-3xl">
              {new Date(course.upcomingDates[0]).getDate()}
            </span>
            <span className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {new Date(course.upcomingDates[0]).toLocaleDateString("en-US", { month: "short" })}
            </span>
          </div>
        )}
        {/* Content */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* Top row: emoji + title + price */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl leading-none" role="img">{style.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                    {course.courseName}
                  </h3>
                  <p className="mt-0.5 text-base text-zinc-500 dark:text-zinc-400">
                    {course.schoolName}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-0.5 text-base font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {formatPrice(course.price)}
                </span>
              </div>

              {/* Description — 2 lines max */}
              <p className="mt-2 line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {course.description}
              </p>

              {/* Tags row */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => {
                  const styleConfig = tag.category === "style" ? getStyle(tag.label).pill : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  return (
                    <span
                      key={`${tag.category}-${tag.label}`}
                      className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styleConfig}`}
                    >
                      {tag.label}
                    </span>
                  )
                })}
              </div>

              {/* Details row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                {course.accommodation && (
                  <span>🏠 {formatDetail(course.accommodation)}</span>
                )}
                {course.meals && (
                  <span>🍽️ {formatDetail(course.meals)}</span>
                )}
                <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition-all hover:font-extrabold hover:gap-2 dark:text-emerald-400">
                  Visit website <span aria-hidden>→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

export function CourseList({ courses }: { courses: YogaCourse[] }) {
  const [location, setLocation] = useState<Location>("Rishikesh")

  const locationCourses = useMemo(
    () => courses.filter((c) => c.location === location),
    [courses, location]
  )

  const locationInfo = LOCATIONS.find((l) => l.id === location)!

  // Build month buckets from all location courses (before tag filtering)
  const { monthKeys, coursesByMonth, undatedCourses } = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`

    const byMonth = new Map<string, YogaCourse[]>()
    const undated: YogaCourse[] = []

    for (const course of locationCourses) {
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
    return { monthKeys: keys, coursesByMonth: byMonth, undatedCourses: sortByDate(undated) }
  }, [locationCourses])

  const allTabs = [...monthKeys, ...(undatedCourses.length > 0 ? ["undated"] : [])]
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const defaultTab = monthKeys.includes(currentMonthKey) ? currentMonthKey : allTabs[0] ?? "undated"
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Courses in the active month (before tag filtering) — used for available tags
  const monthCourses = useMemo(
    () => activeTab === "undated" ? undatedCourses : coursesByMonth.get(activeTab) ?? [],
    [activeTab, undatedCourses, coursesByMonth]
  )

  // Collect tags available in the active month
  const tagsByCategory = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const course of monthCourses) {
      for (const tag of course.tags) {
        if (!map.has(tag.category)) map.set(tag.category, new Map())
        const catMap = map.get(tag.category)!
        catMap.set(tag.label, (catMap.get(tag.label) ?? 0) + 1)
      }
    }
    const result: { category: string; labels: string[] }[] = []
    for (const [category, counts] of map) {
      const labels = [...counts.entries()]
        .map(([label]) => label)
      // Sort numerically for certification/duration, by count for style
      if (category === "style") {
        const countMap = counts
        labels.sort((a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0))
      } else {
        labels.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      }
      result.push({ category, labels })
    }
    const order = ["style", "certification", "duration"]
    result.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
    return result
  }, [monthCourses])

  const allTagLabels = useMemo(
    () => tagsByCategory.flatMap((g) => g.labels),
    [tagsByCategory]
  )

  const [selectedTags, setSelectedTags] = useState<Set<string>>(
    () => new Set(allTagLabels)
  )

  function toggleTag(label: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  function toggleAllTags() {
    if (selectedTags.size === allTagLabels.length) setSelectedTags(new Set())
    else setSelectedTags(new Set(allTagLabels))
  }

  function toggleCategoryAll(labels: string[]) {
    setSelectedTags((prev) => {
      const allSelected = labels.every((l) => prev.has(l))
      const next = new Set(prev)
      for (const l of labels) {
        if (allSelected) next.delete(l)
        else next.add(l)
      }
      return next
    })
  }

  // Reset tag selection when location or month changes
  useEffect(() => {
    setSelectedTags(new Set(allTagLabels))
  }, [location, activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter the month's courses by selected tags
  const displayedCourses = useMemo(
    () => monthCourses.filter((c) =>
      c.tags.some((tag) => selectedTags.has(tag.label))
    ),
    [monthCourses, selectedTags]
  )

  return (
    <div>
      {/* Header with location switcher */}
      <header className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500 blur-3xl" />
          <div className="absolute top-8 left-1/2 h-40 w-40 rounded-full bg-teal-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
          {/* Location switcher + theme toggle */}
          <div className="mb-4 flex items-center gap-2">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setLocation(loc.id)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  location === loc.id
                    ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-900/10 text-zinc-500 hover:bg-zinc-900/20 hover:text-zinc-700 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 dark:hover:text-zinc-200"
                }`}
              >
                {loc.label}
              </button>
            ))}
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {locationInfo.subtitle}
          </p>
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            <img src="/favicon.svg" alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
            Yoga Courses
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            <span className="text-zinc-900 dark:text-white font-semibold">{locationCourses.length}</span> courses from{" "}
            <span className="text-zinc-900 dark:text-white font-semibold">{new Set(locationCourses.map((c) => c.schoolName)).size}</span> schools
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {monthKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 ${
              activeTab === key
                ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
            }`}
          >
            {formatMonthLabel(key)}
            <span className="ml-1 text-xs opacity-70">
              ({coursesByMonth.get(key)?.length ?? 0})
            </span>
          </button>
        ))}
        {undatedCourses.length > 0 && (
          <button
            onClick={() => setActiveTab("undated")}
            className={`cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 ${
              activeTab === "undated"
                ? "bg-zinc-700 text-white shadow-md dark:bg-zinc-300 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            Dates TBD
            <span className="ml-1 text-xs opacity-60">
              ({undatedCourses.length})
            </span>
          </button>
        )}
      </div>

      {/* Tag filters */}
      <div className="relative z-10 my-4 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
        <div className="mb-3 flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Filters</p>
          <button
            onClick={toggleAllTags}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              selectedTags.size === allTagLabels.length
                ? "border-white bg-white text-zinc-900 shadow-sm dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
            }`}
          >
            All
          </button>
        </div>
        {tagsByCategory.map((group) => (
          <div key={group.category} className="mb-2 last:mb-0">
            <p className="mb-1.5 text-xs font-medium capitalize text-zinc-400">{group.category}</p>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const allSelected = group.labels.every((l) => selectedTags.has(l))
                return (
                  <button
                    onClick={() => toggleCategoryAll(group.labels)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                      allSelected
                        ? "border-white bg-white text-zinc-900 shadow-sm dark:border-white dark:bg-white dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    All
                  </button>
                )
              })()}
              {group.labels.map((label) => {
                const selected = selectedTags.has(label)
                const styleConfig = group.category === "style" ? getStyle(label) : null
                const durationPill = !styleConfig && selected
                  ? getDurationPill(label)
                  : null
                return (
                  <button
                    key={label}
                    onClick={() => toggleTag(label)}
                    className={`cursor-pointer flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all hover:brightness-125 ${
                      selected
                        ? styleConfig
                          ? `${styleConfig.pill} border-transparent shadow-sm`
                          : durationPill
                            ? `${durationPill} border-transparent shadow-sm`
                            : "border-zinc-500 bg-zinc-500 text-white shadow-sm dark:border-zinc-400 dark:bg-zinc-400 dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    {styleConfig && <span>{styleConfig.emoji}</span>}
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Course cards grouped by date */}
      <div className="mt-4">
        {displayedCourses.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            No courses match your filters.
          </p>
        ) : (
          groupByDate(displayedCourses).map((group) => (
            <div key={group.date} className="mb-6">
              {/* Date separator */}
              {group.date !== "undated" && (
                <div className="flex items-center gap-4 pb-6 pt-3">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                    {formatDateGroupLabel(group.date)}
                  </span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>
              )}
              <div className="flex flex-col gap-3">
                {group.courses.map((course, i) => (
                  <CourseCard key={`${course.url}-${i}`} course={course} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
