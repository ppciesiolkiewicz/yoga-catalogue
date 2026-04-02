"use client"

import { getStyleConfig, getDurationPill } from "./pill"

interface FilterBarProps {
  tagsByCategory: { category: string; labels: string[] }[]
  selectedTags: Set<string>
  allTagLabels: string[]
  onToggleTag: (label: string) => void
  onToggleAll: () => void
  onToggleCategoryAll: (labels: string[]) => void
}

export function FilterBar({
  tagsByCategory,
  selectedTags,
  allTagLabels,
  onToggleTag,
  onToggleAll,
  onToggleCategoryAll,
}: FilterBarProps) {
  return (
    <div className="relative z-10 my-4 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
      <div className="mb-3 flex items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Filters</p>
        <button
          onClick={onToggleAll}
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
                  onClick={() => onToggleCategoryAll(group.labels)}
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
              const styleConfig = group.category === "style" ? getStyleConfig(label) : null
              const durationPill = !styleConfig && selected
                ? getDurationPill(label)
                : null
              return (
                <button
                  key={label}
                  onClick={() => onToggleTag(label)}
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
  )
}
