import * as cheerio from "cheerio"
import Anthropic from "@anthropic-ai/sdk"
import { existsSync, readFileSync } from "fs"
import type { WebsiteEntry } from "../src/data/types"

export const anthropic = new Anthropic()

export function parseMaxAgeDays(): number | null {
  const idx = process.argv.indexOf("--update-older-than-days")
  if (idx === -1) return null
  const val = parseInt(process.argv[idx + 1], 10)
  if (isNaN(val) || val < 0) {
    console.error("Error: --update-older-than-days requires a non-negative number")
    process.exit(1)
  }
  return val
}

export function isStale(item: { updatedAt: string }, maxAgeDays: number | null): boolean {
  if (maxAgeDays === null) return false
  if (!item.updatedAt) return true
  const age = Date.now() - new Date(item.updatedAt).getTime()
  return age > maxAgeDays * 24 * 60 * 60 * 1000
}

export function getUrlsToSkip(items: { url: string; updatedAt: string }[], maxAgeDays: number | null): Set<string> {
  return new Set(items.filter((c) => !isStale(c, maxAgeDays)).map((c) => c.url))
}

export function loadExistingData<T>(filePath: string, pattern: RegExp): T[] {
  if (!existsSync(filePath)) return []
  try {
    const content = readFileSync(filePath, "utf-8")
    const match = content.match(pattern)
    if (!match) return []
    return JSON.parse(match[1])
  } catch {
    return []
  }
}

export async function fetchPageText(entry: WebsiteEntry): Promise<string | null> {
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

export function requireApiKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is required")
    process.exit(1)
  }
}
