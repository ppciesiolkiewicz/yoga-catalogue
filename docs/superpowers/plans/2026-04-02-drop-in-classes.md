# Drop-in Classes & Route Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add drop-in yoga class listings with day-of-week navigation, restructure the app from single-page to location-based routes with nested layouts.

**Architecture:** Dynamic `[location]` route with nested layout providing shared header/nav/footer. Two child pages: `trainings/` (existing course list) and `drop-in/` (new weekly schedule list). Shared UI components extracted from the current monolithic `course-list.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4

**Important Next.js 16 notes:**
- `params` is a Promise — must `await` in server components, use `use()` in client components
- Use `PageProps<'/[location]/trainings'>` and `LayoutProps<'/[location]'>` type helpers (global, no import needed)
- Use `redirect()` from `next/navigation` for redirects (call outside try/catch)
- Use `notFound()` from `next/navigation` for invalid params
- Use `generateStaticParams` + `dynamicParams = false` to restrict valid locations

---

## File Structure

```
src/
  data/
    types.ts              — MODIFY: add PageType, DropInClass, update WebsiteEntry
    tags.ts               — MODIFY: add generateDropInTags function
    training.ts           — RENAME from index.ts (content unchanged)
    drop-in.ts            — CREATE: empty drop-in data (auto-generated later by scraper)
    index.ts              — CREATE: re-export barrel
    websites-data.ts      — MODIFY: add pageType field to all entries
  components/
    pill.tsx              — CREATE: extracted tag pill component
    filter-bar.tsx        — CREATE: extracted cascading filter component
    course-card.tsx       — CREATE: extracted training course card
    drop-in-card.tsx      — CREATE: new drop-in class card
  app/
    page.tsx              — MODIFY: redirect to /rishikesh/trainings
    layout.tsx            — MODIFY: remove footer (moves to location layout)
    course-list.tsx       — DELETE after extraction complete
    [location]/
      layout.tsx          — CREATE: header, location nav, type nav, footer
      page.tsx            — CREATE: redirect to ./trainings
      trainings/
        page.tsx          — CREATE: server component loading courses
        training-list.tsx — CREATE: client component (filtering/display)
      drop-in/
        page.tsx          — CREATE: server component loading drop-in classes
        drop-in-list.tsx  — CREATE: client component (day tabs/filtering)
  scripts/
    scrape.ts             — MODIFY: branch on pageType, write to two files
```

---

### Task 1: Update Data Types

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Add PageType, DropInClass, and update WebsiteEntry**

Replace the entire file with:

```typescript
export type Location = "Rishikesh" | "Dharamshala"

export type PageType = "training" | "drop-in"

export type TagCategory = "style" | "certification" | "duration"

export interface Tag {
  label: string
  category: TagCategory
}

export interface WebsiteEntry {
  schoolName: string
  url: string
  location: Location
  pageType: PageType
}

export interface YogaCourse {
  schoolName: string
  courseName: string
  url: string
  type: string
  certificationLevel: string
  durationDays: number
  price: {
    amount: number
    currency: string
  }
  description: string
  upcomingDates: string[]
  accommodation: boolean | string
  meals: boolean | string
  rating: number | null
  reviewCount: number | null
  tags: Tag[]
  location: Location
  updatedAt: string
}

export interface DropInClass {
  schoolName: string
  className: string
  url: string
  style: string
  schedule: {
    dayOfWeek: number
    startTime: string
    endTime?: string
  }[]
  price?: { amount: number; currency: string }
  description: string
  location: Location
  tags: Tag[]
  updatedAt: string
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Errors about missing `pageType` in `websites-data.ts` (expected, will fix in Task 2)

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add DropInClass type and pageType to WebsiteEntry"
```

---

### Task 2: Update websites-data.ts with pageType

**Files:**
- Modify: `src/data/websites-data.ts`

- [ ] **Step 1: Add `pageType: "training"` to every existing entry**

Every entry in the `websites` array currently has `{ schoolName, url, location }`. Add `pageType: "training" as const` to each one. Use find-and-replace:

Find: `location: "Rishikesh",\n    url:` → Replace with: `location: "Rishikesh",\n    pageType: "training",\n    url:`

And same for `"Dharamshala"`. Or use a script — the key is every entry gets `pageType: "training"`.

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Clean (no errors)

- [ ] **Step 3: Commit**

```bash
git add src/data/websites-data.ts
git commit -m "feat: add pageType field to all website entries"
```

---

### Task 3: Rename and Re-export Data Files

**Files:**
- Rename: `src/data/index.ts` → `src/data/training.ts`
- Create: `src/data/drop-in.ts`
- Create: `src/data/index.ts` (barrel)
- Modify: `src/data/tags.ts`

- [ ] **Step 1: Rename index.ts to training.ts**

```bash
git mv src/data/index.ts src/data/training.ts
```

- [ ] **Step 2: Create empty drop-in data file**

Create `src/data/drop-in.ts`:

```typescript
// This file is auto-generated by scripts/scrape.ts — do not edit manually
import type { DropInClass } from "./types"

export const dropInClasses: DropInClass[] = []
```

- [ ] **Step 3: Create barrel index.ts**

Create `src/data/index.ts`:

```typescript
export { courses } from "./training"
export { dropInClasses } from "./drop-in"
```

- [ ] **Step 4: Add generateDropInTags to tags.ts**

Add this function to the end of `src/data/tags.ts`:

```typescript
/** Generate tags for a drop-in class (style only) */
export function generateDropInTags(dropIn: Pick<DropInClass, "style">): Tag[] {
  const tags: Tag[] = []
  for (const label of getStyleTags(dropIn.style)) {
    tags.push({ label, category: "style" })
  }
  return tags
}
```

Also add `DropInClass` to the import at the top of the file:

```typescript
import type { YogaCourse, Tag, DropInClass } from "./types"
```

- [ ] **Step 5: Update any imports referencing the old path**

The only import of `@/data/index` is in `src/app/page.tsx`. Update it:

```typescript
import { courses } from "@/data"
```

This works because `@/data` resolves to `@/data/index.ts` (the new barrel).

- [ ] **Step 6: Verify build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/data/training.ts src/data/drop-in.ts src/data/index.ts src/data/tags.ts src/app/page.tsx
git commit -m "refactor: split data into training.ts and drop-in.ts with barrel export"
```

---

### Task 4: Extract Shared Components — Pill

**Files:**
- Create: `src/components/pill.tsx`

- [ ] **Step 1: Create the Pill component**

Create `src/components/pill.tsx`:

```tsx
import type { Tag } from "@/data/types"

const STYLE_CONFIG: Record<string, { pill: string; emoji: string }> = {
  Ashtanga: {
    pill: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    emoji: "🔥",
  },
  Vinyasa: {
    pill: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    emoji: "🌊",
  },
  Hatha: {
    pill: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    emoji: "☀️",
  },
  Yin: {
    pill: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    emoji: "🌙",
  },
  Kundalini: {
    pill: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    emoji: "⚡",
  },
  Aerial: {
    pill: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
    emoji: "🦋",
  },
  Retreat: {
    pill: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    emoji: "🏔️",
  },
  Meditation: {
    pill: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    emoji: "🧘",
  },
  "Sound Healing": {
    pill: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
    emoji: "🔔",
  },
  "Multi-Style TTC": {
    pill: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
    emoji: "🕉️",
  },
  Yoga: {
    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    emoji: "🧘",
  },
}

const DEFAULT_STYLE = {
  pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  emoji: "📿",
}

export function getStyleConfig(label: string) {
  return STYLE_CONFIG[label] ?? DEFAULT_STYLE
}

/** Full style config including border/bg for cards */
export const CARD_STYLE_CONFIG: Record<string, { pill: string; border: string; bg: string; check: string; emoji: string }> = {
  Ashtanga: { ...STYLE_CONFIG.Ashtanga, border: "border-l-orange-500", bg: "from-orange-50 dark:from-orange-950/20", check: "accent-orange-500" },
  Vinyasa: { ...STYLE_CONFIG.Vinyasa, border: "border-l-amber-500", bg: "from-amber-50 dark:from-amber-950/20", check: "accent-amber-500" },
  Hatha: { ...STYLE_CONFIG.Hatha, border: "border-l-red-400", bg: "from-red-50 dark:from-red-950/20", check: "accent-red-500" },
  Yin: { ...STYLE_CONFIG.Yin, border: "border-l-purple-500", bg: "from-purple-50 dark:from-purple-950/20", check: "accent-purple-500" },
  Kundalini: { ...STYLE_CONFIG.Kundalini, border: "border-l-yellow-500", bg: "from-yellow-50 dark:from-yellow-950/20", check: "accent-yellow-500" },
  Aerial: { ...STYLE_CONFIG.Aerial, border: "border-l-pink-500", bg: "from-pink-50 dark:from-pink-950/20", check: "accent-pink-500" },
  Retreat: { ...STYLE_CONFIG.Retreat, border: "border-l-teal-500", bg: "from-teal-50 dark:from-teal-950/20", check: "accent-teal-500" },
  Meditation: { ...STYLE_CONFIG.Meditation, border: "border-l-indigo-500", bg: "from-indigo-50 dark:from-indigo-950/20", check: "accent-indigo-500" },
  "Sound Healing": { ...STYLE_CONFIG["Sound Healing"], border: "border-l-rose-500", bg: "from-rose-50 dark:from-rose-950/20", check: "accent-rose-500" },
  "Multi-Style TTC": { ...STYLE_CONFIG["Multi-Style TTC"], border: "border-l-sky-500", bg: "from-sky-50 dark:from-sky-950/20", check: "accent-sky-500" },
  Yoga: { ...STYLE_CONFIG.Yoga, border: "border-l-zinc-400", bg: "", check: "accent-zinc-500" },
}

const DEFAULT_CARD_STYLE = {
  pill: DEFAULT_STYLE.pill,
  border: "border-l-zinc-400",
  bg: "",
  check: "accent-zinc-500",
  emoji: DEFAULT_STYLE.emoji,
}

export function getCardStyle(label: string) {
  return CARD_STYLE_CONFIG[label] ?? DEFAULT_CARD_STYLE
}

export function getDurationPill(label: string): string {
  if (label.endsWith("h")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
  }
  const days = parseInt(label, 10)
  if (days <= 7) return "bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300"
  if (days <= 14) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300"
  if (days <= 30) return "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300"
  return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300"
}

export function getStyleTag(tags: Tag[]): string {
  const style = tags.find((t) => t.category === "style")
  return style?.label ?? "Other"
}

/** Static display pill on cards */
export function TagPill({ tag }: { tag: Tag }) {
  const styleConfig = tag.category === "style"
    ? getStyleConfig(tag.label).pill
    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${styleConfig}`}>
      {tag.label}
    </span>
  )
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add src/components/pill.tsx
git commit -m "refactor: extract Pill and style config into shared component"
```

---

### Task 5: Extract Shared Components — FilterBar

**Files:**
- Create: `src/components/filter-bar.tsx`

- [ ] **Step 1: Create the FilterBar component**

Create `src/components/filter-bar.tsx`:

```tsx
"use client"

import { getStyleConfig, getDurationPill } from "./pill"

interface FilterBarProps {
  /** Tag groups in display order, each with category name and available labels */
  tagsByCategory: { category: string; labels: string[] }[]
  /** Currently selected tag labels */
  selectedTags: Set<string>
  /** All tag labels across all categories (for "All" toggle) */
  allTagLabels: string[]
  /** Toggle a single tag */
  onToggleTag: (label: string) => void
  /** Toggle all tags on/off */
  onToggleAll: () => void
  /** Toggle all tags in a category on/off */
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/filter-bar.tsx
git commit -m "refactor: extract FilterBar into shared component"
```

---

### Task 6: Extract CourseCard Component

**Files:**
- Create: `src/components/course-card.tsx`

- [ ] **Step 1: Create CourseCard**

Create `src/components/course-card.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/course-card.tsx
git commit -m "refactor: extract CourseCard into shared component"
```

---

### Task 7: Create DropInCard Component

**Files:**
- Create: `src/components/drop-in-card.tsx`

- [ ] **Step 1: Create DropInCard**

Create `src/components/drop-in-card.tsx`:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/drop-in-card.tsx
git commit -m "feat: create DropInCard component"
```

---

### Task 8: Create Location Layout

**Files:**
- Create: `src/app/[location]/layout.tsx`

This layout provides the shared header, location switcher, Training/Drop-in nav, and footer for all pages under a location.

- [ ] **Step 1: Create the location layout**

Create `src/app/[location]/layout.tsx`:

```tsx
import { notFound } from "next/navigation"
import type { Location } from "@/data/types"
import { LocationHeader } from "./location-header"

const VALID_LOCATIONS: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export function generateStaticParams() {
  return Object.keys(VALID_LOCATIONS).map((location) => ({ location }))
}

export const dynamicParams = false

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ location: string }>
}) {
  const { location } = await params
  const locationName = VALID_LOCATIONS[location]
  if (!locationName) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <LocationHeader location={location} locationName={locationName} />
      <div className="flex-1">
        {children}
      </div>
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-100 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} rishikeshyoga.info
        </p>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Create the LocationHeader client component**

Create `src/app/[location]/location-header.tsx`:

```tsx
"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Location } from "@/data/types"
import { ThemeToggle } from "../theme-toggle"

const LOCATIONS: { slug: string; label: string; subtitle: string }[] = [
  { slug: "rishikesh", label: "Rishikesh", subtitle: "Uttarakhand, India" },
  { slug: "dharamshala", label: "Dharamshala", subtitle: "Himachal Pradesh, India" },
]

const TYPE_TABS = [
  { slug: "trainings", label: "Trainings & Retreats" },
  { slug: "drop-in", label: "Drop-in Classes" },
]

export function LocationHeader({ location, locationName }: { location: string; locationName: Location }) {
  const pathname = usePathname()
  const locationInfo = LOCATIONS.find((l) => l.slug === location)!
  // Determine the current sub-path (trainings or drop-in)
  const currentType = pathname.split("/").pop() ?? "trainings"

  return (
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
            <Link
              key={loc.slug}
              href={`/${loc.slug}/${currentType}`}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location === loc.slug
                  ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-900/10 text-zinc-500 hover:bg-zinc-900/20 hover:text-zinc-700 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 dark:hover:text-zinc-200"
              }`}
            >
              {loc.label}
            </Link>
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
          Yoga in {locationName}
        </h1>

        {/* Training / Drop-in tabs */}
        <div className="mt-6 flex gap-1">
          {TYPE_TABS.map((tab) => (
            <Link
              key={tab.slug}
              href={`/${location}/${tab.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                currentType === tab.slug
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Clean (pages not yet wired up, but layout should compile)

- [ ] **Step 4: Commit**

```bash
git add src/app/\[location\]/layout.tsx src/app/\[location\]/location-header.tsx
git commit -m "feat: create location layout with header, nav tabs, and footer"
```

---

### Task 9: Create TrainingList and Trainings Page

**Files:**
- Create: `src/app/[location]/trainings/training-list.tsx`
- Create: `src/app/[location]/trainings/page.tsx`

- [ ] **Step 1: Create TrainingList client component**

Create `src/app/[location]/trainings/training-list.tsx`. This is the filtering/display logic extracted from `course-list.tsx`, using the new shared components.

```tsx
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
        return c.tags.some((tag) => tag.category === category && labels.has(tag.label))
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
```

- [ ] **Step 2: Create trainings server page**

Create `src/app/[location]/trainings/page.tsx`:

```tsx
import { courses } from "@/data"
import type { Location } from "@/data/types"
import { TrainingList } from "./training-list"

const LOCATION_MAP: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export default async function TrainingsPage(props: PageProps<"/[location]/trainings">) {
  const { location } = await props.params
  const locationName = LOCATION_MAP[location]!
  const locationCourses = courses.filter((c) => c.location === locationName)

  return <TrainingList courses={locationCourses} />
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -15`
Expected: Build succeeds, `/[location]/trainings` appears in routes

- [ ] **Step 4: Commit**

```bash
git add src/app/\[location\]/trainings/
git commit -m "feat: create trainings page with extracted TrainingList"
```

---

### Task 10: Create DropInList and Drop-in Page

**Files:**
- Create: `src/app/[location]/drop-in/drop-in-list.tsx`
- Create: `src/app/[location]/drop-in/page.tsx`

- [ ] **Step 1: Create DropInList client component**

Create `src/app/[location]/drop-in/drop-in-list.tsx`:

```tsx
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
```

- [ ] **Step 2: Create drop-in server page**

Create `src/app/[location]/drop-in/page.tsx`:

```tsx
import { dropInClasses } from "@/data"
import type { Location } from "@/data/types"
import { DropInList } from "./drop-in-list"

const LOCATION_MAP: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export default async function DropInPage(props: PageProps<"/[location]/drop-in">) {
  const { location } = await props.params
  const locationName = LOCATION_MAP[location]!
  const locationClasses = dropInClasses.filter((c) => c.location === locationName)

  return <DropInList classes={locationClasses} />
}
```

- [ ] **Step 3: Verify build**

Run: `npx next build 2>&1 | tail -15`
Expected: Build succeeds, both `/[location]/trainings` and `/[location]/drop-in` routes appear

- [ ] **Step 4: Commit**

```bash
git add src/app/\[location\]/drop-in/
git commit -m "feat: create drop-in page with day-of-week tabs and style filters"
```

---

### Task 11: Create Redirect Pages and Clean Up

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/[location]/page.tsx`
- Delete: `src/app/course-list.tsx`

- [ ] **Step 1: Update root page to redirect**

Replace `src/app/page.tsx` with:

```tsx
import { redirect } from "next/navigation"

export default function Home() {
  redirect("/rishikesh/trainings")
}
```

- [ ] **Step 2: Create location index redirect**

Create `src/app/[location]/page.tsx`:

```tsx
import { redirect } from "next/navigation"

export default async function LocationPage(props: PageProps<"/[location]">) {
  const { location } = await props.params
  redirect(`/${location}/trainings`)
}
```

- [ ] **Step 3: Remove old course-list.tsx**

```bash
rm src/app/course-list.tsx
```

- [ ] **Step 4: Remove footer from root layout (now in location layout)**

In `src/app/layout.tsx`, the body just has `{children}` and `<Analytics />`. No changes needed — the footer was in `page.tsx` which we just replaced.

- [ ] **Step 5: Verify full build**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds. Routes should include:
- `/` (redirect)
- `/[location]` (redirect)
- `/[location]/trainings`
- `/[location]/drop-in`

- [ ] **Step 6: Verify dev server manually**

Run: `npx next dev` and check:
- `http://localhost:3000` → redirects to `/rishikesh/trainings`
- `/rishikesh/trainings` → shows current course list
- `/rishikesh/drop-in` → shows empty drop-in page with "No drop-in classes available yet"
- `/dharamshala/trainings` → shows Dharamshala courses
- Location switcher links work
- Training/Drop-in tab links work
- Theme toggle works

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire up redirects and remove old single-page component"
```

---

### Task 12: Update Scraper for Drop-in Support

**Files:**
- Modify: `scripts/scrape.ts`

- [ ] **Step 1: Update scraper to handle both page types**

Replace `scripts/scrape.ts` with the updated version that branches on `pageType`:

```typescript
import * as cheerio from "cheerio"
import Anthropic from "@anthropic-ai/sdk"
import { writeFileSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
import { websites } from "../src/data/websites-data"
import type { WebsiteEntry, YogaCourse, DropInClass } from "../src/data/types"
import { generateTags, generateDropInTags } from "../src/data/tags"

const anthropic = new Anthropic()
const trainingOutPath = join(__dirname, "../src/data/training.ts")
const dropInOutPath = join(__dirname, "../src/data/drop-in.ts")

function parseMaxAgeDays(): number | null {
  const idx = process.argv.indexOf("--update-older-than-days")
  if (idx === -1) return null
  const val = parseInt(process.argv[idx + 1], 10)
  if (isNaN(val) || val < 0) {
    console.error("Error: --update-older-than-days requires a non-negative number")
    process.exit(1)
  }
  return val
}

const maxAgeDays = parseMaxAgeDays()

function loadExistingCourses(): YogaCourse[] {
  if (!existsSync(trainingOutPath)) return []
  try {
    const content = readFileSync(trainingOutPath, "utf-8")
    const match = content.match(/export const courses: YogaCourse\[] = (\[[\s\S]*\])/)
    if (!match) return []
    return JSON.parse(match[1])
  } catch {
    return []
  }
}

function loadExistingDropIns(): DropInClass[] {
  if (!existsSync(dropInOutPath)) return []
  try {
    const content = readFileSync(dropInOutPath, "utf-8")
    const match = content.match(/export const dropInClasses: DropInClass\[] = (\[[\s\S]*\])/)
    if (!match) return []
    return JSON.parse(match[1])
  } catch {
    return []
  }
}

function isStale(item: { updatedAt: string }): boolean {
  if (maxAgeDays === null) return false
  if (!item.updatedAt) return true
  const age = Date.now() - new Date(item.updatedAt).getTime()
  return age > maxAgeDays * 24 * 60 * 60 * 1000
}

function getUrlsToSkip(items: { url: string; updatedAt: string }[]): Set<string> {
  return new Set(items.filter((c) => !isStale(c)).map((c) => c.url))
}

async function fetchPageText(entry: WebsiteEntry): Promise<string | null> {
  try {
    console.log(`Fetching: ${entry.url}`)
    const response = await fetch(entry.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    if (!response.ok) {
      console.warn(`  ⚠ HTTP ${response.status} for ${entry.url}`)
      return null
    }
    const html = await response.text()
    const $ = cheerio.load(html)
    $("script, style, nav, footer, header, iframe, noscript").remove()
    const text = $("body").text().replace(/\s+/g, " ").trim()
    return text.slice(0, 8000)
  } catch (error) {
    console.warn(`  ⚠ Failed to fetch ${entry.url}: ${error}`)
    return null
  }
}

async function extractCourses(
  pageText: string,
  entry: WebsiteEntry
): Promise<YogaCourse[]> {
  console.log(`  Extracting courses with Claude API...`)

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You extract structured data about yoga courses from website text.
Return ONLY a JSON array of course objects. If no yoga courses are found, return an empty array [].
Each course object must match this schema exactly:
{
  "schoolName": "string - name of the yoga school",
  "courseName": "string - name of the specific course",
  "url": "string - will be provided, use as-is",
  "type": "string - e.g. Yin Yoga Teacher Training, Hatha Yoga TTC, 200-Hour Yoga TTC, Ashtanga Vinyasa TTC, Yoga Retreat, Kundalini Yoga TTC, Aerial Yoga TTC",
  "certificationLevel": "string - e.g. 50hr, 100hr, 200hr RYT, 300hr, 500hr, or empty string if not specified",
  "durationDays": "number - duration in days, 0 if unknown",
  "price": { "amount": "number", "currency": "string - e.g. USD, EUR, INR" },
  "description": "string - brief description of the course (2-3 sentences)",
  "upcomingDates": ["string - ISO date format YYYY-MM-DD for each upcoming start date"],
  "accommodation": "boolean or string - true/false, or description like 'Private room included'",
  "meals": "boolean or string - true/false, or description like '3 vegetarian meals daily'",
  "rating": "number or null - rating out of 5 if available",
  "reviewCount": "number or null - number of reviews if available"
}
Return raw JSON only. No markdown, no code fences, no explanation.`,
    messages: [
      {
        role: "user",
        content: `Extract yoga course information from this website text. The school is "${entry.schoolName}" and the URL is "${entry.url}".\n\nWebsite text:\n${pageText}`,
      },
    ],
  })

  let text =
    response.content[0].type === "text" ? response.content[0].text : ""
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

  try {
    const courses = JSON.parse(text) as Omit<YogaCourse, "updatedAt">[]
    const now = new Date().toISOString()
    const withTimestamp: YogaCourse[] = courses.map((c) => ({ ...c, tags: generateTags(c), location: entry.location, updatedAt: now }))
    console.log(`  Found ${withTimestamp.length} course(s)`)
    return withTimestamp
  } catch {
    console.warn(`  ⚠ Failed to parse Claude response as JSON`)
    console.warn(`  Response preview: ${text.slice(0, 200)}`)
    return []
  }
}

async function extractDropInClasses(
  pageText: string,
  entry: WebsiteEntry
): Promise<DropInClass[]> {
  console.log(`  Extracting drop-in classes with Claude API...`)

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You extract structured data about drop-in yoga classes from website text.
Drop-in classes are regular weekly classes that students can attend without enrolling in a full course.
Return ONLY a JSON array of class objects. If no drop-in classes are found, return an empty array [].
Each class object must match this schema exactly:
{
  "schoolName": "string - name of the yoga school",
  "className": "string - name of the class, e.g. 'Morning Hatha Yoga'",
  "url": "string - will be provided, use as-is",
  "style": "string - yoga style, e.g. Hatha, Vinyasa, Ashtanga, Yin, Kundalini, Meditation, Pranayama",
  "schedule": [
    {
      "dayOfWeek": "number - 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday",
      "startTime": "string - 24h format HH:MM, e.g. '07:00'",
      "endTime": "string or null - 24h format HH:MM if available, e.g. '08:30'"
    }
  ],
  "price": { "amount": "number", "currency": "string" } or null if not available,
  "description": "string - brief description (1-2 sentences)"
}
If a class runs every day, include all 7 days in the schedule array.
If a class runs on specific days, only include those days.
Return raw JSON only. No markdown, no code fences, no explanation.`,
    messages: [
      {
        role: "user",
        content: `Extract drop-in yoga class information from this website text. The school is "${entry.schoolName}" and the URL is "${entry.url}".\n\nWebsite text:\n${pageText}`,
      },
    ],
  })

  let text =
    response.content[0].type === "text" ? response.content[0].text : ""
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

  try {
    const classes = JSON.parse(text) as Omit<DropInClass, "updatedAt" | "tags" | "location">[]
    const now = new Date().toISOString()
    const withMeta: DropInClass[] = classes.map((c) => ({
      ...c,
      tags: generateDropInTags(c),
      location: entry.location,
      updatedAt: now,
    }))
    console.log(`  Found ${withMeta.length} drop-in class(es)`)
    return withMeta
  } catch {
    console.warn(`  ⚠ Failed to parse Claude response as JSON`)
    console.warn(`  Response preview: ${text.slice(0, 200)}`)
    return []
  }
}

function writeTrainingOutput(courses: YogaCourse[]) {
  const output = `// This file is auto-generated by scripts/scrape.ts — do not edit manually
import type { YogaCourse } from "./types"

export const courses: YogaCourse[] = ${JSON.stringify(courses, null, 2)}
`
  writeFileSync(trainingOutPath, output, "utf-8")
  console.log(`\nWrote ${courses.length} courses to src/data/training.ts`)
}

function writeDropInOutput(classes: DropInClass[]) {
  const output = `// This file is auto-generated by scripts/scrape.ts — do not edit manually
import type { DropInClass } from "./types"

export const dropInClasses: DropInClass[] = ${JSON.stringify(classes, null, 2)}
`
  writeFileSync(dropInOutPath, output, "utf-8")
  console.log(`Wrote ${classes.length} drop-in classes to src/data/drop-in.ts`)
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }

  const existingCourses = loadExistingCourses()
  const existingDropIns = loadExistingDropIns()
  const freshTrainingUrls = getUrlsToSkip(existingCourses)
  const freshDropInUrls = getUrlsToSkip(existingDropIns)

  const trainingWebsites = websites.filter((w) => w.pageType === "training")
  const dropInWebsites = websites.filter((w) => w.pageType === "drop-in")

  const toScrapeTraining = trainingWebsites.filter((w) => !freshTrainingUrls.has(w.url))
  const toScrapeDropIn = dropInWebsites.filter((w) => !freshDropInUrls.has(w.url))

  if (toScrapeTraining.length === 0 && toScrapeDropIn.length === 0) {
    console.log("All websites are up to date. Use --update-older-than-days 0 to re-scrape all.")
    return
  }

  // Scrape trainings
  if (toScrapeTraining.length > 0) {
    console.log(`\nScraping ${toScrapeTraining.length} training websites...\n`)
    const newCourses: YogaCourse[] = []
    for (const entry of toScrapeTraining) {
      const text = await fetchPageText(entry)
      if (!text) continue
      try {
        const courses = await extractCourses(text, entry)
        newCourses.push(...courses)
      } catch (error) {
        console.warn(`  ⚠ Claude API error for ${entry.url}: ${error}`)
      }
    }
    const scrapedUrls = new Set(toScrapeTraining.map((w) => w.url))
    const kept = existingCourses.filter((c) => !scrapedUrls.has(c.url))
    writeTrainingOutput([...kept, ...newCourses])
  } else {
    console.log("All training websites are up to date.")
  }

  // Scrape drop-ins
  if (toScrapeDropIn.length > 0) {
    console.log(`\nScraping ${toScrapeDropIn.length} drop-in websites...\n`)
    const newDropIns: DropInClass[] = []
    for (const entry of toScrapeDropIn) {
      const text = await fetchPageText(entry)
      if (!text) continue
      try {
        const classes = await extractDropInClasses(text, entry)
        newDropIns.push(...classes)
      } catch (error) {
        console.warn(`  ⚠ Claude API error for ${entry.url}: ${error}`)
      }
    }
    const scrapedUrls = new Set(toScrapeDropIn.map((w) => w.url))
    const kept = existingDropIns.filter((c) => !scrapedUrls.has(c.url))
    writeDropInOutput([...kept, ...newDropIns])
  } else {
    console.log("All drop-in websites are up to date.")
  }
}

main()
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -10`
Expected: Clean

- [ ] **Step 3: Commit**

```bash
git add scripts/scrape.ts
git commit -m "feat: update scraper to handle both training and drop-in page types"
```

---

### Task 13: Final Verification

- [ ] **Step 1: Run full build**

Run: `npx next build 2>&1 | tail -20`
Expected: Clean build with all routes:
```
/
/[location]
/[location]/trainings
/[location]/drop-in
```

- [ ] **Step 2: Manual smoke test**

Run `npx next dev` and verify:
1. `http://localhost:3000` → redirects to `/rishikesh/trainings`
2. `/rishikesh/trainings` → shows all training courses with month tabs, filters, cards
3. `/rishikesh/drop-in` → shows "No drop-in classes available yet" (empty data)
4. `/dharamshala/trainings` → shows Dharamshala trainings
5. Location switcher preserves current type (training/drop-in)
6. Training/Drop-in tabs switch between pages
7. Theme toggle works
8. Footer shows on all pages
9. `/invalid-location` → 404

- [ ] **Step 3: Commit any final fixes and tag completion**

```bash
git add -A
git commit -m "feat: complete drop-in classes infrastructure and route restructuring"
```
