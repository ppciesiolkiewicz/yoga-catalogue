"use client"

import { useState, useMemo, useEffect } from "react"
import type { YogaCourse } from "@/data/types"
import { FilterBar } from "@/components/filter-bar"
import { CourseCard } from "@/components/course-card"

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

function sortByDate(courses: YogaCourse[]) {
  return [...courses].sort((a, b) => {
    const dateA = a.upcomingDates[0] ?? "9999"
    const dateB = b.upcomingDates[0] ?? "9999"
    return dateA.localeCompare(dateB)
  })
}

const CATEGORY_ORDER = ["style", "certification", "duration"]

export function TrainingList({ courses }: { courses: YogaCourse[] }) {
  // Build month buckets
  const { monthKeys, coursesByMonth, undatedCourses } = useMemo(() => {
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`

    const byMonth = new Map<string, YogaCourse[]>()
    const undated: YogaCourse[] = []

    for (const course of courses) {
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
  }, [courses])

  const allTabs = [...monthKeys, ...(undatedCourses.length > 0 ? ["undated"] : [])]
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const defaultTab = monthKeys.includes(currentMonthKey) ? currentMonthKey : allTabs[0] ?? "undated"
  const [activeTab, setActiveTab] = useState(defaultTab)

  const monthCourses = useMemo(
    () => activeTab === "undated" ? undatedCourses : coursesByMonth.get(activeTab) ?? [],
    [activeTab, undatedCourses, coursesByMonth]
  )

  // All tags in active month
  const allTagsByCategory = useMemo((): { category: string; labels: string[] }[] => {
    const result: { category: string; labels: string[] }[] = []
    for (const category of CATEGORY_ORDER) {
      const counts = new Map<string, number>()
      for (const course of monthCourses) {
        for (const tag of course.tags) {
          if (tag.category === category) {
            counts.set(tag.label, (counts.get(tag.label) ?? 0) + 1)
          }
        }
      }
      if (counts.size === 0) continue
      const labels = [...counts.keys()]
      if (category === "style") {
        labels.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
      } else {
        labels.sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
      }
      result.push({ category, labels })
    }
    return result
  }, [monthCourses])

  const allTagLabels = useMemo(
    () => allTagsByCategory.flatMap((g) => g.labels),
    [allTagsByCategory]
  )

  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set(allTagLabels))

  // Cascading tag visibility
  const tagsByCategory = useMemo((): { category: string; labels: string[] }[] => {
    const result: { category: string; labels: string[] }[] = []
    let coursesPool = monthCourses

    for (const group of allTagsByCategory) {
      const available = new Set<string>()
      for (const course of coursesPool) {
        for (const tag of course.tags) {
          if (tag.category === group.category) available.add(tag.label)
        }
      }
      const labels = group.labels.filter((l) => available.has(l))
      if (labels.length === 0) continue
      result.push({ category: group.category, labels })

      const selectedInCategory = labels.filter((l) => selectedTags.has(l))
      if (selectedInCategory.length > 0) {
        const selected = new Set(selectedInCategory)
        coursesPool = coursesPool.filter((c) =>
          c.tags.some((tag) => tag.category === group.category && selected.has(tag.label))
        )
      }
    }
    return result
  }, [monthCourses, allTagsByCategory, selectedTags])

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

  // Reset tags on tab change
  useEffect(() => {
    setSelectedTags(new Set(allTagLabels))
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // AND across categories, OR within
  const displayedCourses = useMemo(() => {
    const selectedByCategory = new Map<string, Set<string>>()
    for (const group of tagsByCategory) {
      const selected = group.labels.filter((l) => selectedTags.has(l))
      selectedByCategory.set(group.category, new Set(selected))
    }
    return monthCourses.filter((c) =>
      [...selectedByCategory.entries()].every(([category, labels]) => {
        if (labels.size === 0) return false
        const courseCategoryTags = c.tags.filter((tag) => tag.category === category)
        if (courseCategoryTags.length === 0) return true
        return courseCategoryTags.some((tag) => labels.has(tag.label))
      })
    )
  }, [monthCourses, selectedTags, tagsByCategory])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Summary */}
      <p className="mb-4 text-base text-zinc-500 dark:text-zinc-400">
        <span className="text-zinc-900 dark:text-white font-semibold">{courses.length}</span> courses from{" "}
        <span className="text-zinc-900 dark:text-white font-semibold">{new Set(courses.map((c) => c.schoolName)).size}</span> schools
      </p>

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
            <span className="ml-1 text-xs opacity-60">({undatedCourses.length})</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        tagsByCategory={tagsByCategory}
        selectedTags={selectedTags}
        allTagLabels={allTagLabels}
        onToggleTag={toggleTag}
        onToggleAll={toggleAllTags}
        onToggleCategoryAll={toggleCategoryAll}
      />

      {/* Course cards */}
      <div className="mt-4">
        {displayedCourses.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            No courses match your filters.
          </p>
        ) : (
          groupByDate(displayedCourses).map((group) => (
            <div key={group.date} className="mb-6">
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
  )
}
