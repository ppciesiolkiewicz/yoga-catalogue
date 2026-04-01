# Yin Yoga Course Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a scraping pipeline that fetches yin yoga course pages from Rishikesh schools, uses Claude API to extract structured data, and writes the result to a typed TypeScript file.

**Architecture:** A curated website list (`websites-data.ts`) feeds a scraping script (`scripts/scrape.ts`) that fetches HTML, extracts text with cheerio, sends it to Claude for structured parsing, and writes the output to `src/data/index.ts`. Types are shared via `src/data/types.ts`.

**Tech Stack:** TypeScript, cheerio, @anthropic-ai/sdk, tsx, Node.js native fetch

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/data/types.ts` | Shared types: `WebsiteEntry`, `YogaCourse` |
| `src/data/websites-data.ts` | Curated list of yin yoga school URLs |
| `scripts/scrape.ts` | Main scraping script: fetch → extract → AI parse → write output |
| `src/data/index.ts` | Generated output file (array of `YogaCourse`) |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install cheerio @anthropic-ai/sdk
```

- [ ] **Step 2: Install dev dependency**

```bash
npm install -D tsx
```

- [ ] **Step 3: Add scrape script to package.json**

Add to the `"scripts"` section in `package.json`:

```json
"scrape": "tsx scripts/scrape.ts"
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add cheerio, anthropic sdk, and tsx dependencies"
```

---

### Task 2: Create shared types

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: Write the types file**

```ts
export interface WebsiteEntry {
  schoolName: string
  url: string
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
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/data/types.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat: add shared types for yoga course scraper"
```

---

### Task 3: Create curated website list

**Files:**
- Create: `src/data/websites-data.ts`

- [ ] **Step 1: Research yin yoga schools in Rishikesh**

Use web search to find 10-15 websites offering yin yoga courses/teacher trainings in Rishikesh. Focus on schools that specifically mention yin yoga (not just generic yoga TTC). Look for:
- Dedicated yin yoga teacher training programs
- Retreat centers offering yin yoga courses
- Schools with yin yoga as a specialty or major offering

- [ ] **Step 2: Write the websites-data file**

```ts
import type { WebsiteEntry } from "./types"

export const websites: WebsiteEntry[] = [
  // Populate with 10-15 entries from research.
  // Each entry:
  // {
  //   schoolName: "School Name",
  //   url: "https://example.com/yin-yoga-course-page"
  // }
  //
  // Use the most specific URL for yin yoga courses (not the homepage).
  // Example:
  {
    schoolName: "Rishikesh Yogpeeth",
    url: "https://www.rishikeshyogpeeth.com/yoga-courses/yin-yoga-teacher-training.html"
  },
  // ... more entries from research
]
```

Important: link to the specific yin yoga course page, not the school homepage, so the scraper gets relevant content.

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit src/data/websites-data.ts
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/data/websites-data.ts
git commit -m "feat: add curated list of yin yoga school websites"
```

---

### Task 4: Build the scraping script

**Files:**
- Create: `scripts/scrape.ts`

- [ ] **Step 1: Write the HTML fetching and text extraction function**

```ts
import * as cheerio from "cheerio"
import type { WebsiteEntry } from "../src/data/types"

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

    // Remove non-content elements
    $("script, style, nav, footer, header, iframe, noscript").remove()

    // Extract text from body
    const text = $("body").text().replace(/\s+/g, " ").trim()

    // Limit to ~8000 chars to stay within reasonable token limits
    return text.slice(0, 8000)
  } catch (error) {
    console.warn(`  ⚠ Failed to fetch ${entry.url}: ${error}`)
    return null
  }
}
```

- [ ] **Step 2: Write the Claude API extraction function**

```ts
import Anthropic from "@anthropic-ai/sdk"
import type { YogaCourse } from "../src/data/types"

const anthropic = new Anthropic()

async function extractCourses(
  pageText: string,
  entry: WebsiteEntry
): Promise<YogaCourse[]> {
  console.log(`  Extracting courses with Claude API...`)

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    system: `You extract structured data about yin yoga courses from website text. 
Return ONLY a JSON array of course objects. If no yin yoga courses are found, return an empty array [].
Each course object must match this schema exactly:
{
  "schoolName": "string - name of the yoga school",
  "courseName": "string - name of the specific course",
  "url": "string - will be provided, use as-is",
  "type": "string - e.g. Yin Yoga Teacher Training, Yin Yoga Retreat, Yin & Yang TTC",
  "certificationLevel": "string - e.g. 50hr, 100hr, 200hr RYT, or empty string if not specified",
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
        content: `Extract yin yoga course information from this website text. The school is "${entry.schoolName}" and the URL is "${entry.url}".\n\nWebsite text:\n${pageText}`,
      },
    ],
  })

  const text =
    response.content[0].type === "text" ? response.content[0].text : ""

  try {
    const courses: YogaCourse[] = JSON.parse(text)
    console.log(`  Found ${courses.length} course(s)`)
    return courses
  } catch {
    console.warn(`  ⚠ Failed to parse Claude response as JSON`)
    return []
  }
}
```

- [ ] **Step 3: Write the output file generator**

```ts
import { writeFileSync } from "fs"
import { join } from "path"

function writeOutput(courses: YogaCourse[]) {
  const output = `// This file is auto-generated by scripts/scrape.ts — do not edit manually
import type { YogaCourse } from "./types"

export const courses: YogaCourse[] = ${JSON.stringify(courses, null, 2)}
`

  const outPath = join(import.meta.dirname, "../src/data/index.ts")
  writeFileSync(outPath, output, "utf-8")
  console.log(`\nWrote ${courses.length} courses to src/data/index.ts`)
}
```

- [ ] **Step 4: Write the main function that ties it all together**

```ts
import { websites } from "../src/data/websites-data"

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }

  console.log(`Scraping ${websites.length} websites...\n`)

  const allCourses: YogaCourse[] = []

  for (const entry of websites) {
    const text = await fetchPageText(entry)
    if (!text) continue

    const courses = await extractCourses(text, entry)
    allCourses.push(...courses)
  }

  writeOutput(allCourses)
}

main()
```

- [ ] **Step 5: Assemble the complete file**

Combine all the pieces above into a single `scripts/scrape.ts` file in the correct order:
1. Imports (deduplicated at the top)
2. `anthropic` client initialization
3. `fetchPageText` function
4. `extractCourses` function
5. `writeOutput` function
6. `main` function
7. `main()` call

- [ ] **Step 6: Verify it compiles**

```bash
npx tsc --noEmit scripts/scrape.ts
```

Expected: no errors. (If there are path resolution issues with tsc, verify manually that there are no syntax errors by running `npx tsx --no-cache scripts/scrape.ts --help` or similar dry check.)

- [ ] **Step 7: Commit**

```bash
git add scripts/scrape.ts
git commit -m "feat: add scraping script with cheerio + Claude API extraction"
```

---

### Task 5: Run the scraper and verify output

**Files:**
- Generated: `src/data/index.ts`

- [ ] **Step 1: Run the scraper**

```bash
ANTHROPIC_API_KEY=<key> npm run scrape
```

Expected output: logs showing each website being fetched, course extraction, and final write to `src/data/index.ts`.

- [ ] **Step 2: Review the generated output**

Read `src/data/index.ts` and verify:
- The file compiles (`npx tsc --noEmit src/data/index.ts`)
- Courses have reasonable data (names, prices, dates look correct)
- No empty/garbage entries

- [ ] **Step 3: Commit the generated data**

```bash
git add src/data/index.ts
git commit -m "feat: add scraped yin yoga course data"
```

---

### Task 6: Add scrape script entry to package.json

This was already done in Task 1 Step 3. Verify it works:

- [ ] **Step 1: Verify npm run scrape works**

```bash
ANTHROPIC_API_KEY=<key> npm run scrape
```

Expected: same behavior as Task 5.

- [ ] **Step 2: Final commit if any cleanup needed**

```bash
git status
# If there are changes:
git add -A && git commit -m "chore: final scraper cleanup"
```
