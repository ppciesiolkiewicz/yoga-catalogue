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

function sortByDate(courses: YogaCourse[]) {
  return [...courses].sort((a, b) => {
    const dateA = a.upcomingDates[0] ?? "9999"
    const dateB = b.upcomingDates[0] ?? "9999"
    return dateA.localeCompare(dateB)
  })
}

function CourseCard({ course }: { course: YogaCourse }) {
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-zinc-200 border-l-4 ${TYPE_BORDER[getTypes(course.type)[0]] ?? "border-l-zinc-300"} bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {course.courseName}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {course.schoolName}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {formatPrice(course.price)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {course.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {course.certificationLevel && (
          <Tag>{course.certificationLevel}</Tag>
        )}
        {course.durationDays > 0 && (
          <Tag>{course.durationDays} days</Tag>
        )}
        {course.type && (
          <TypeTag type={course.type} />
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
            <span className="font-medium">Dates:</span>{" "}
            {course.upcomingDates.map(formatDate).join(", ")}
          </div>
        )}
      </div>
    </a>
  )
}

const TYPE_COLORS: Record<string, string> = {
  Yin: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  Hatha: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Ashtanga: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  Vinyasa: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Kundalini: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Aerial: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Retreat: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  Meditation: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  "Sound Healing": "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  "Multi-Style TTC": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
}

const TYPE_BORDER: Record<string, string> = {
  Yin: "border-l-purple-400",
  Hatha: "border-l-green-400",
  Ashtanga: "border-l-orange-400",
  Vinyasa: "border-l-blue-400",
  Kundalini: "border-l-amber-400",
  Aerial: "border-l-pink-400",
  Retreat: "border-l-teal-400",
  Meditation: "border-l-indigo-400",
  "Sound Healing": "border-l-rose-400",
  "Multi-Style TTC": "border-l-cyan-400",
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  )
}

function TypeTag({ type }: { type: string }) {
  const types = getTypes(type)
  return (
    <>
      {types.map((t) => (
        <span
          key={t}
          className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[t] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
        >
          {t}
        </span>
      ))}
    </>
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

    // Sort courses within each month by type then date
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
      {/* Type filter checkboxes */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={selectedTypes.size === allTypes.length}
            onChange={toggleAll}
            className="rounded"
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">All</span>
        </label>
        <span className="text-zinc-300 dark:text-zinc-700">|</span>
        {allTypes.map((type) => (
          <label
            key={type}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-opacity ${
              TYPE_COLORS[type] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            } ${selectedTypes.has(type) ? "opacity-100" : "opacity-40"}`}
          >
            <input
              type="checkbox"
              checked={selectedTypes.has(type)}
              onChange={() => toggleType(type)}
              className="sr-only"
            />
            {type}
          </label>
        ))}
      </div>

      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {monthKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white"
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
                ? "bg-zinc-700 text-white dark:bg-zinc-300 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
          <p className="py-8 text-center text-sm text-zinc-400">
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
