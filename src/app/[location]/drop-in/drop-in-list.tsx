"use client"

import { useState, useMemo, useEffect } from "react"
import type { DropInClass } from "@/data/types"
import { FilterBar } from "@/components/filter-bar"
import { DropInCard } from "@/components/drop-in-card"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function sortByTime(classes: DropInClass[], dayOfWeek: number) {
  return [...classes].sort((a, b) => {
    const slotA = a.schedule.find((s) => s.dayOfWeek === dayOfWeek)
    const slotB = b.schedule.find((s) => s.dayOfWeek === dayOfWeek)
    return (slotA?.startTime ?? "99:99").localeCompare(slotB?.startTime ?? "99:99")
  })
}

export function DropInList({ classes }: { classes: DropInClass[] }) {
  const today = new Date().getDay()
  const [activeDay, setActiveDay] = useState(today)

  // Classes available on the selected day
  const dayClasses = useMemo(
    () => classes.filter((c) => c.schedule.some((s) => s.dayOfWeek === activeDay)),
    [classes, activeDay]
  )

  // Count classes per day for tab badges
  const dayCounts = useMemo(() => {
    const counts = new Array(7).fill(0)
    for (const c of classes) {
      for (const s of c.schedule) {
        counts[s.dayOfWeek]++
      }
    }
    return counts
  }, [classes])

  // Available days (only show tabs for days that have classes)
  const availableDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => i).filter((d) => dayCounts[d] > 0),
    [dayCounts]
  )

  // Tags — style only
  const allTagsByCategory = useMemo((): { category: string; labels: string[] }[] => {
    const counts = new Map<string, number>()
    for (const c of dayClasses) {
      for (const tag of c.tags) {
        if (tag.category === "style") {
          counts.set(tag.label, (counts.get(tag.label) ?? 0) + 1)
        }
      }
    }
    if (counts.size === 0) return []
    const labels = [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
    return [{ category: "style", labels }]
  }, [dayClasses])

  const allTagLabels = useMemo(
    () => allTagsByCategory.flatMap((g) => g.labels),
    [allTagsByCategory]
  )

  const [selectedTags, setSelectedTags] = useState<Set<string>>(() => new Set(allTagLabels))

  // Reset tags on day change
  useEffect(() => {
    setSelectedTags(new Set(allTagLabels))
  }, [activeDay]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter by selected style tags
  const displayedClasses = useMemo(() => {
    const selectedStyles = allTagLabels.filter((l) => selectedTags.has(l))
    if (selectedStyles.length === 0) return []
    const selected = new Set(selectedStyles)
    return sortByTime(
      dayClasses.filter((c) => c.tags.some((tag) => tag.category === "style" && selected.has(tag.label))),
      activeDay
    )
  }, [dayClasses, selectedTags, allTagLabels, activeDay])

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Summary */}
      <p className="mb-4 text-base text-zinc-500 dark:text-zinc-400">
        <span className="text-zinc-900 dark:text-white font-semibold">{classes.length}</span> drop-in classes from{" "}
        <span className="text-zinc-900 dark:text-white font-semibold">{new Set(classes.map((c) => c.schoolName)).size}</span> schools
      </p>

      {/* Day-of-week tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3" style={{ scrollbarWidth: "none" }}>
        {availableDays.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`cursor-pointer shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2 ${
              activeDay === day
                ? "bg-emerald-600 text-white shadow-md dark:bg-emerald-500"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
            }`}
          >
            <span className="sm:hidden">{DAY_SHORT[day]}</span>
            <span className="hidden sm:inline">{DAY_NAMES[day]}</span>
            <span className="ml-1 text-xs opacity-70">({dayCounts[day]})</span>
          </button>
        ))}
      </div>

      {/* Style filters */}
      {allTagsByCategory.length > 0 && (
        <FilterBar
          tagsByCategory={allTagsByCategory}
          selectedTags={selectedTags}
          allTagLabels={allTagLabels}
          onToggleTag={toggleTag}
          onToggleAll={toggleAllTags}
          onToggleCategoryAll={toggleCategoryAll}
        />
      )}

      {/* Drop-in cards */}
      <div className="mt-4 flex flex-col gap-3">
        {displayedClasses.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-400">
            {classes.length === 0
              ? "No drop-in classes available yet. Check back soon!"
              : "No classes match your filters."}
          </p>
        ) : (
          displayedClasses.map((dropIn, i) => (
            <DropInCard key={`${dropIn.url}-${i}`} dropIn={dropIn} dayOfWeek={activeDay} />
          ))
        )}
      </div>
    </div>
  )
}
