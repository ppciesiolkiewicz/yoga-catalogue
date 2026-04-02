import type { DropInClass } from "@/data/types"
import { getStyleTag, getCardStyle, TagPill } from "./pill"

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour12 = h % 12 || 12
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, "0")} ${suffix}`
}

function formatPrice(price?: { amount: number; currency: string }): string | null {
  if (!price || price.amount === 0) return null
  return `${price.currency} ${price.amount.toLocaleString()}`
}

export function DropInCard({ dropIn, dayOfWeek }: { dropIn: DropInClass; dayOfWeek: number }) {
  const primaryType = getStyleTag(dropIn.tags)
  const style = getCardStyle(primaryType)
  const slot = dropIn.schedule.find((s) => s.dayOfWeek === dayOfWeek) ?? dropIn.schedule[0]
  const priceStr = formatPrice(dropIn.price)

  return (
    <a
      href={dropIn.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-zinc-200 border-l-4 ${style.border} bg-gradient-to-r ${style.bg} to-white transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:to-zinc-900`}
    >
      <div className="flex">
        {/* Time column */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-zinc-200 px-2 py-4 dark:border-zinc-800 sm:w-24">
          <span className="text-lg font-bold text-zinc-800 dark:text-zinc-200 sm:text-xl">
            {formatTime(slot.startTime)}
          </span>
          {slot.endTime && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatTime(slot.endTime)}
            </span>
          )}
        </div>
        {/* Content */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-xl leading-none" role="img">{style.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
                    {dropIn.className}
                  </h3>
                  <p className="mt-0.5 text-base text-zinc-500 dark:text-zinc-400">
                    {dropIn.schoolName}
                  </p>
                </div>
                {priceStr && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-0.5 text-base font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {priceStr}
                  </span>
                )}
              </div>
              {dropIn.description && (
                <p className="mt-2 line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {dropIn.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {dropIn.tags.map((tag) => (
                  <TagPill key={`${tag.category}-${tag.label}`} tag={tag} />
                ))}
              </div>
              <div className="mt-4 flex items-center text-sm text-zinc-500 dark:text-zinc-400">
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
