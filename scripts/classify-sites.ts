import * as cheerio from "cheerio"
import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { websites } from "../src/data/websites-data"
import type { ScrapeMode } from "../src/data/types"

const __dirname = dirname(fileURLToPath(import.meta.url))
const websitesDataPath = join(__dirname, "../src/data/websites-data.ts")

const dryRun = process.argv.includes("--dry-run")

interface ClassificationResult {
  url: string
  detectedTech: string
  scrapeMode: ScrapeMode
  bodyTextLength: number
}

const MIN_BODY_TEXT_LENGTH = 200

function detectTech(html: string, bodyTextLength: number): { detectedTech: string; scrapeMode: ScrapeMode } {
  const lower = html.toLowerCase()

  // Wix
  if (lower.includes("wix-thunderbolt") || lower.includes("x-wix-") || lower.includes("_wixcidx") || lower.includes("wixsite.com")) {
    return { detectedTech: "wix", scrapeMode: "browser" }
  }

  // WordPress + Divi
  if ((lower.includes("wp-content") || lower.includes("wp-includes")) && (lower.includes("et_builder") || lower.includes("et-db") || lower.includes("divi"))) {
    return { detectedTech: "wordpress-divi", scrapeMode: "browser" }
  }

  // WordPress + Elementor
  if ((lower.includes("wp-content") || lower.includes("wp-includes")) && (lower.includes("elementor") || lower.includes("elementor-widget"))) {
    return { detectedTech: "wordpress-elementor", scrapeMode: "browser" }
  }

  // React SPA
  if (lower.includes('<div id="root">') && bodyTextLength < MIN_BODY_TEXT_LENGTH) {
    return { detectedTech: "react-spa", scrapeMode: "browser" }
  }

  // WordPress (standard, server-rendered)
  if (lower.includes("wp-content") || lower.includes("wp-includes")) {
    return { detectedTech: "wordpress", scrapeMode: "fetch" }
  }

  // Static / unknown
  const tech = "static"
  const scrapeMode: ScrapeMode = bodyTextLength < MIN_BODY_TEXT_LENGTH ? "browser" : "fetch"
  return { detectedTech: tech, scrapeMode }
}

async function classifyUrl(url: string): Promise<ClassificationResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })
    if (!response.ok) {
      console.warn(`  ⚠ HTTP ${response.status} for ${url}`)
      return { url, detectedTech: "unknown", scrapeMode: "browser", bodyTextLength: 0 }
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    $("script, style, nav, footer, header, iframe, noscript").remove()
    const bodyText = $("body").text().replace(/\s+/g, " ").trim()
    const bodyTextLength = bodyText.length

    const { detectedTech, scrapeMode } = detectTech(html, bodyTextLength)
    return { url, detectedTech, scrapeMode, bodyTextLength }
  } catch (error) {
    console.warn(`  ⚠ Failed to fetch ${url}: ${error}`)
    return { url, detectedTech: "unknown", scrapeMode: "browser", bodyTextLength: 0 }
  }
}

function updateWebsitesDataFile(results: Map<string, ClassificationResult>) {
  let content = readFileSync(websitesDataPath, "utf-8")

  for (const [url, result] of results) {
    // Find the entry object containing this URL and add/update scrapeMode and detectedTech
    const urlPattern = new RegExp(
      `(\\{[^}]*url:\\s*"${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^}]*)(\\})`,
      "s"
    )
    const match = content.match(urlPattern)
    if (!match) continue

    let entry = match[1]

    // Remove existing scrapeMode/detectedTech lines if present
    entry = entry.replace(/\s*scrapeMode:\s*"[^"]*",?\n?/g, "")
    entry = entry.replace(/\s*detectedTech:\s*"[^"]*",?\n?/g, "")

    // Add new fields before the closing brace
    const indent = "    "
    const newFields = `${indent}scrapeMode: "${result.scrapeMode}",\n${indent}detectedTech: "${result.detectedTech}",\n  `
    content = content.replace(urlPattern, `${entry}${newFields}${match[2]}`)
  }

  writeFileSync(websitesDataPath, content, "utf-8")
}

async function main() {
  const uniqueUrls = [...new Set(websites.map((w) => w.url))]
  console.log(`Classifying ${uniqueUrls.length} unique URLs...\n`)

  const results = new Map<string, ClassificationResult>()
  const stats = { fetch: 0, browser: 0 }

  for (const url of uniqueUrls) {
    console.log(`Classifying: ${url}`)
    const result = await classifyUrl(url)
    results.set(url, result)
    stats[result.scrapeMode]++
    console.log(`  → ${result.detectedTech} (${result.scrapeMode}) [${result.bodyTextLength} chars]\n`)
  }

  console.log(`\nResults: ${stats.fetch} fetch, ${stats.browser} browser`)

  if (dryRun) {
    console.log("\n--dry-run: no files modified")
    return
  }

  updateWebsitesDataFile(results)
  console.log(`\nUpdated ${websitesDataPath}`)
}

main()
