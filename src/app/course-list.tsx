"use client"

import { useState, useMemo, useEffect } from "react"
import type { YogaCourse, Location } from "@/data/types"
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
    if (t.includes("yoga") || t.includes("ytt") || t.includes("teacher training") || t.includes("200") || t.includes("300") || t.includes("500")) types.push("Multi-Style TTC")
    else types.push("Other")
  }
  return types
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
  const primaryType = getTypes(course.type)[0]
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
                {getTypes(course.type).map((t) => (
                  <span
                    key={t}
                    className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${getStyle(t).pill}`}
                  >
                    {t}
                  </span>
                ))}
                {course.certificationLevel && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {course.certificationLevel}
                  </span>
                )}
                {course.durationDays > 0 && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {course.durationDays} days
                  </span>
                )}
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

  const allTypes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const course of locationCourses) {
      for (const t of getTypes(course.type)) {
        counts.set(t, (counts.get(t) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type)
  }, [locationCourses])

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(allTypes)
  )

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function toggleAll() {
    if (selectedTypes.size === allTypes.length) setSelectedTypes(new Set())
    else setSelectedTypes(new Set(allTypes))
  }

  // Reset filters when location changes
  useEffect(() => {
    setSelectedTypes(new Set(allTypes))
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  const locationInfo = LOCATIONS.find((l) => l.id === location)!

  const filtered = useMemo(
    () => locationCourses.filter((c) => getTypes(c.type).some((t) => selectedTypes.has(t))),
    [locationCourses, selectedTypes]
  )

  const { monthKeys, coursesByMonth, undatedCourses } = useMemo(() => {
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
    return { monthKeys: keys, coursesByMonth: byMonth, undatedCourses: sortByDate(undated) }
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
      {/* Header with location switcher */}
      <header className="relative overflow-hidden bg-zinc-900 dark:bg-zinc-900">
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
                    ? "bg-white text-zinc-900 shadow-md"
                    : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-zinc-200"
                }`}
              >
                {loc.label}
              </button>
            ))}
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
            {locationInfo.subtitle}
          </p>
          <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            <img src="/favicon.svg" alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
            Yoga Courses
          </h1>
          <p className="mt-3 text-base text-zinc-400">
            <span className="text-white font-semibold">{locationCourses.length}</span> courses from{" "}
            <span className="text-white font-semibold">{new Set(locationCourses.map((c) => c.schoolName)).size}</span> schools
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Type filter */}
      <div className="relative z-10 mb-5 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Filter by style</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleAll}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
              selectedTypes.size === allTypes.length
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
            }`}
          >
            All
          </button>
          {allTypes.map((type) => {
            const style = getStyle(type)
            const selected = selectedTypes.has(type)
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`cursor-pointer flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all hover:brightness-125 ${
                  selected
                    ? `${style.pill} border-transparent shadow-sm`
                    : "border-zinc-200 text-zinc-400 hover:border-zinc-400 dark:border-zinc-700"
                }`}
              >
                <span>{style.emoji}</span>
                {type}
              </button>
            )
          })}
        </div>
      </div>

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
