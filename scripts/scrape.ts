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
