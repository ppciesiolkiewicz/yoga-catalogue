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

function normalizeType(type: string): string {
  const t = type.toLowerCase()
  if (t.includes("aerial")) return "Aerial"
  if (t.includes("kundalini")) return "Kundalini"
  if (t.includes("yin")) return "Yin"
  if (t.includes("ashtanga") && t.includes("vinyasa")) return "Ashtanga Vinyasa"
  if (t.includes("ashtanga")) return "Ashtanga"
  if (t.includes("hatha")) return "Hatha"
  if (t.includes("retreat")) return "Retreat"
  if (t.includes("sound healing")) return "Sound Healing"
  if (t.includes("meditation")) return "Meditation"
  if (t.includes("200") || t.includes("300") || t.includes("500")) return "Multi-Style TTC"
  return "Other"
}

function sortByTypeAndDate(courses: YogaCourse[]) {
  return [...courses].sort((a, b) => {
    const typeA = normalizeType(a.type)
    const typeB = normalizeType(b.type)
    if (typeA !== typeB) return typeA.localeCompare(typeB)
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
      className="block rounded-lg border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
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
          <Tag>{course.type}</Tag>
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  )
}

export function CourseList({ courses }: { courses: YogaCourse[] }) {
  // Extract all unique normalized types
  const allTypes = useMemo(() => {
    const types = new Set(courses.map((c) => normalizeType(c.type)))
    return [...types].sort()
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

  // Filter courses by selected types
  const filtered = useMemo(
    () => courses.filter((c) => selectedTypes.has(normalizeType(c.type))),
    [courses, selectedTypes]
  )

  const { monthKeys, coursesByMonth, undatedCourses } = useMemo(() => {
    const byMonth = new Map<string, YogaCourse[]>()
    const undated: YogaCourse[] = []

    for (const course of filtered) {
      if (course.upcomingDates.length === 0) {
        undated.push(course)
        continue
      }
      for (const date of course.upcomingDates) {
        const key = getMonthKey(date)
        if (!byMonth.has(key)) byMonth.set(key, [])
        byMonth.get(key)!.push({ ...course, upcomingDates: [date] })
      }
    }

    // Sort courses within each month by type then date
    for (const [, list] of byMonth) {
      list.splice(0, list.length, ...sortByTypeAndDate(list))
    }

    const keys = [...byMonth.keys()].sort()
    return {
      monthKeys: keys,
      coursesByMonth: byMonth,
      undatedCourses: sortByTypeAndDate(undated),
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
          <label key={type} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={selectedTypes.has(type)}
              onChange={() => toggleType(type)}
              className="rounded"
            />
            <span className="text-zinc-600 dark:text-zinc-400">{type}</span>
          </label>
        ))}
      </div>

      {/* Month tabs */}
      <div className="flex gap-1 overflow-x-auto pb-3">
        {monthKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {formatMonthLabel(key)}
            <span className="ml-1.5 text-xs opacity-60">
              ({coursesByMonth.get(key)?.length ?? 0})
            </span>
          </button>
        ))}
        {undatedCourses.length > 0 && (
          <button
            onClick={() => setActiveTab("undated")}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "undated"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
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
