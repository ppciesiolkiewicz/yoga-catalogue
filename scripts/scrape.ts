import * as cheerio from "cheerio"
import Anthropic from "@anthropic-ai/sdk"
import { writeFileSync, existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
import { websites } from "../src/data/websites-data"
import type { WebsiteEntry, YogaCourse } from "../src/data/types"

const anthropic = new Anthropic()
const outPath = join(__dirname, "../src/data/index.ts")

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
  if (!existsSync(outPath)) return []
  try {
    const content = readFileSync(outPath, "utf-8")
    const match = content.match(/export const courses: YogaCourse\[] = (\[[\s\S]*\])/)
    if (!match) return []
    return JSON.parse(match[1])
  } catch {
    return []
  }
}

function isStale(course: YogaCourse): boolean {
  if (maxAgeDays === null) return false
  if (!course.updatedAt) return true
  const age = Date.now() - new Date(course.updatedAt).getTime()
  return age > maxAgeDays * 24 * 60 * 60 * 1000
}

function getUrlsToSkip(courses: YogaCourse[]): Set<string> {
  return new Set(courses.filter((c) => !isStale(c)).map((c) => c.url))
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

  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim()

  try {
    const courses = JSON.parse(text) as Omit<YogaCourse, "updatedAt">[]
    const now = new Date().toISOString()
    const withTimestamp: YogaCourse[] = courses.map((c) => ({ ...c, location: entry.location, updatedAt: now }))
    console.log(`  Found ${withTimestamp.length} course(s)`)
    return withTimestamp
  } catch {
    console.warn(`  ⚠ Failed to parse Claude response as JSON`)
    console.warn(`  Response preview: ${text.slice(0, 200)}`)
    return []
  }
}

function writeOutput(courses: YogaCourse[]) {
  const output = `// This file is auto-generated by scripts/scrape.ts — do not edit manually
import type { YogaCourse } from "./types"

export const courses: YogaCourse[] = ${JSON.stringify(courses, null, 2)}
`

  writeFileSync(outPath, output, "utf-8")
  console.log(`\nWrote ${courses.length} courses to src/data/index.ts`)
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }

  const existing = loadExistingCourses()
  const freshUrls = getUrlsToSkip(existing)

  const toScrape = websites.filter((w) => !freshUrls.has(w.url))

  if (toScrape.length === 0) {
    console.log("All websites are up to date. Use --update-older-than-days 0 to re-scrape all.")
    return
  }

  console.log(`Scraping ${toScrape.length} websites (${existing.length - toScrape.length} up to date)...\n`)

  const newCourses: YogaCourse[] = []

  for (const entry of toScrape) {
    const text = await fetchPageText(entry)
    if (!text) continue

    try {
      const courses = await extractCourses(text, entry)
      newCourses.push(...courses)
    } catch (error) {
      console.warn(`  ⚠ Claude API error for ${entry.url}: ${error}`)
    }
  }

  // Keep fresh existing courses, replace stale ones with new scrapes
  const scrapedUrls = new Set(toScrape.map((w) => w.url))
  const kept = existing.filter((c) => !scrapedUrls.has(c.url))
  writeOutput([...kept, ...newCourses])
}

main()
