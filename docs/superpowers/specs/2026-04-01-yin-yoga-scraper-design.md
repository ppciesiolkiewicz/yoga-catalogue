# Yin Yoga Course Scraper — Design Spec

## Goal

Create a scraping pipeline that collects yin yoga course information from schools in Rishikesh, India and saves structured data for use in the Next.js app.

## Architecture

Two files + one script:

```
src/data/websites-data.ts   — curated list of yoga school URLs
scripts/scrape.ts           — scraping + AI extraction script
src/data/index.ts           — generated output (structured course data)
```

### Flow

```
websites-data.ts → scrape.ts → (fetch HTML) → (cheerio extract text) → (Claude API parse) → index.ts
```

## 1. `src/data/websites-data.ts`

Exports an array of website entries to scrape:

```ts
export interface WebsiteEntry {
  schoolName: string
  url: string
}

export const websites: WebsiteEntry[]
```

Curated list of ~10-15 yin yoga schools/retreat centers in Rishikesh. Populated via web research.

## 2. `scripts/scrape.ts`

Run with: `npx tsx scripts/scrape.ts`

### Steps

1. Import the website list from `../src/data/websites-data.ts`
2. For each website:
   a. Fetch the HTML with native `fetch`
   b. Extract text content using `cheerio` (strip nav, footer, scripts)
   c. Send extracted text to Claude API (claude-sonnet-4-6) with a structured prompt
   d. Parse Claude's JSON response into typed course objects
3. Collect all courses into a single array
4. Write `src/data/index.ts` with the typed export

### Claude API prompt strategy

Send the page text with a system prompt instructing Claude to:
- Extract all yin yoga courses/trainings offered
- Return a JSON array matching the `YogaCourse` schema
- Parse dates into ISO format
- Infer accommodation/meals from context
- Return empty array if no relevant courses found

### Error handling

- Skip websites that fail to fetch (log warning, continue)
- Skip websites where Claude returns no courses
- Log progress to console

## 3. Data Schema — `YogaCourse`

```ts
export interface YogaCourse {
  schoolName: string
  courseName: string
  url: string
  type: string                // e.g. "Yin Yoga Teacher Training"
  certificationLevel: string  // e.g. "50hr", "100hr", "200hr RYT"
  durationDays: number
  price: {
    amount: number
    currency: string
  }
  description: string
  upcomingDates: string[]     // ISO date strings
  accommodation: boolean | string
  meals: boolean | string
  rating: number | null
  reviewCount: number | null
}
```

## 4. Dependencies

| Package | Purpose |
|---------|---------|
| `cheerio` | HTML parsing and text extraction |
| `@anthropic-ai/sdk` | Claude API for AI-powered data extraction |
| `tsx` (dev) | Run TypeScript scripts directly |

## 5. Environment

The script requires `ANTHROPIC_API_KEY` environment variable. The script reads it from `process.env` — no `.env` file handling built in (user can set it however they prefer).

## 6. Output format

`src/data/index.ts` is a generated file containing:

```ts
import type { YogaCourse } from "./types"

export const courses: YogaCourse[] = [
  // ... generated data
]
```

Types live in `src/data/types.ts` so both the script and the app can import them.
