import type { YogaCourse } from "@/data/types"
import { getStyleTag, getCardStyle, TagPill } from "./pill"

function formatPrice(price: { amount: number; currency: string }) {
  if (price.amount === 0) return "Contact"
  return `${price.currency} ${price.amount.toLocaleString()}`
}

function formatDetail(val: boolean | string) {
  if (val === true || val === "true") return "Included"
  if (val === false || val === "false") return "Not included"
  return String(val).replace(/^string - /i, "")
}

export function CourseCard({ course }: { course: YogaCourse }) {
  const primaryType = getStyleTag(course.tags)
  const style = getCardStyle(primaryType)

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-lg border border-zinc-200 border-l-4 ${style.border} bg-gradient-to-r ${style.bg} to-white transition-all hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:to-zinc-900`}
    >
      <div className="flex">
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
        <div className="min-w-0 flex-1 p-4 sm:p-5">
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
              <p className="mt-2 line-clamp-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {course.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {course.tags.map((tag) => (
                  <TagPill key={`${tag.category}-${tag.label}`} tag={tag} />
                ))}
              </div>
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
