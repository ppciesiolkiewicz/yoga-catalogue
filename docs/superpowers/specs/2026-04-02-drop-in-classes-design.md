# Drop-in Classes & Route Restructuring

## Overview

Add drop-in yoga class listings alongside the existing trainings/retreats data. Restructure the app from a single page to location-based routes with separate pages for trainings and drop-in classes.

## Routing

```
/                               → redirect to /rishikesh/trainings
/[location]                     → redirect to /[location]/trainings
/[location]/trainings           → training/retreat course list
/[location]/drop-in             → drop-in class list
```

`[location]` is a dynamic segment validated against known locations (`rishikesh`, `dharamshala`). Unknown locations return 404.

### File structure

```
src/app/
  page.tsx                        → redirect to /rishikesh/trainings
  [location]/
    layout.tsx                    → header, location switcher, Training/Drop-in nav, footer
    page.tsx                      → redirect to ./trainings
    trainings/
      page.tsx                    → server component, loads courses, renders TrainingList
    drop-in/
      page.tsx                    → server component, loads drop-in classes, renders DropInList
```

### Location layout (`[location]/layout.tsx`)

Provides shared UI for all pages under a location:
- Site header with title and theme toggle
- Location switcher (links to other locations, preserving current sub-path e.g. `/dharamshala/drop-in`)
- Training / Drop-in navigation tabs (links, active state based on current path)
- Footer ("(c) 2026 rishikeshyoga.info")

## Data Model

### Types

Add to `src/data/types.ts`:

```ts
type PageType = "training" | "drop-in"

// Updated WebsiteEntry
interface WebsiteEntry {
  schoolName: string
  url: string
  location: Location
  pageType: PageType  // "pageType" to avoid confusion with YogaCourse.type
}

// New type
interface DropInClass {
  schoolName: string
  className: string
  url: string
  style: string
  schedule: {
    dayOfWeek: number    // 0=Sun, 1=Mon, ... 6=Sat
    startTime: string    // "07:00"
    endTime?: string     // "08:30"
  }[]
  price?: { amount: number; currency: string }
  description: string
  location: Location
  tags: Tag[]
  updatedAt: string
}
```

### Data files

- `src/data/training.ts` — renamed from `src/data/index.ts`, exports `courses` (auto-generated)
- `src/data/drop-in.ts` — new auto-generated file, exports `dropInClasses`
- `src/data/index.ts` — re-exports both: `export { courses } from "./training"` and `export { dropInClasses } from "./drop-in"`

### Tags for drop-in classes

Only `style` category (no certification or duration). Reuse existing style keyword detection from `tags.ts`.

## Scraper Changes

### Website data (`src/data/websites-data.ts`)

Add `pageType` field to all entries. Existing entries get `pageType: "training"`. New drop-in URLs get `pageType: "drop-in"`.

### Scraper (`scripts/scrape.ts`)

Branch on `entry.pageType`:

- `"training"` — current extraction prompt and `YogaCourse` output schema, writes to `src/data/training.ts`
- `"drop-in"` — new prompt asking Claude to extract weekly schedule (day of week, start/end time), style, price. Uses `DropInClass` output schema, writes to `src/data/drop-in.ts`

## Shared Components

Extract from the current monolithic `course-list.tsx` (614 lines):

```
src/components/
  pill.tsx          — tag/filter chip (label, category, active, onClick)
  filter-bar.tsx    — tag filter section with cascading AND/OR logic
  course-card.tsx   — training course card (existing design)
  drop-in-card.tsx  — drop-in class card (schedule/time instead of date tile)
```

### Pill

Reusable tag chip used in filter bars and on cards. Props: `label`, `category`, `active`, `onClick`. Styled per category (style = colored by yoga style, certification = blue, duration = warm tones).

### FilterBar

The cascading tag filter UI. AND across categories, OR within a category. Used on both pages. Trainings page passes style + certification + duration categories. Drop-in page passes only style.

### CourseCard

Existing card design extracted from `course-list.tsx`. Shows date tile, course name, school, price, description, tags, accommodation/meals, external link.

### DropInCard

New card for drop-in classes. Similar visual style to CourseCard but shows:
- Time slot (e.g. "7:00 AM") instead of date tile
- Class name and school name
- Style tag
- Price (if available)
- Description
- External link

## Page Behavior

### Training page (`/[location]/trainings`)

Same as current behavior:
1. Month tabs (with course counts) — default to current month
2. Style / Certification / Duration filter pills (cascading AND/OR)
3. Course cards grouped by date within selected month

Client component: `TrainingList` — owns month tab state and selected tags state.

### Drop-in page (`/[location]/drop-in`)

1. Day-of-week tabs (Mon, Tue, Wed, Thu, Fri, Sat, Sun) — default to today
2. Style filter pills only (cascading)
3. Drop-in cards sorted by start time
4. Classes with multiple schedule entries appear on each relevant day tab

Client component: `DropInList` — owns day-of-week state and selected tags state.

## Migration

- Current `src/app/page.tsx` and `src/app/course-list.tsx` are replaced by the new route structure
- `src/data/index.ts` renamed to `src/data/training.ts`, new `index.ts` re-exports
- `course-list.tsx` broken into shared components + `TrainingList` (page-level client component)
- All existing functionality preserved, just reorganized under `/[location]/trainings`
