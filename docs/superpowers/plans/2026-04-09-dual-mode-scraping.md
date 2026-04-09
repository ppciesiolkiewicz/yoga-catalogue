# Dual-Mode Scraping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-classify yoga school websites by tech stack and use Playwright for sites that need browser rendering, keeping the existing fetch+Cheerio path for static sites.

**Architecture:** A classification script detects each site's framework (Wix, Divi, Elementor, React SPA, WordPress, static) from raw HTML and tags entries in `websites-data.ts` with `scrapeMode` and `detectedTech`. The existing scraping scripts then dispatch to `fetchPageText()` or a new `fetchPageTextBrowser()` based on the tag.

**Tech Stack:** Playwright (Chromium only), Cheerio, TypeScript, tsx

**Spec:** `docs/superpowers/specs/2026-04-09-dual-mode-scraping-design.md`

---

### Task 1: Add types and install Playwright

**Files:**
- Modify: `src/data/types.ts`
- Modify: `package.json`

- [ ] **Step 1: Add `ScrapeMode` type and update `WebsiteEntry`**

In `src/data/types.ts`, add the `ScrapeMode` type and two optional fields to `WebsiteEntry`:

```typescript
export type ScrapeMode = "fetch" | "browser"

export interface WebsiteEntry {
  schoolName: string
  url: string
  location: Location
  pageType: PageType
  scrapeMode?: ScrapeMode
  detectedTech?: string
}
```

- [ ] **Step 2: Install Playwright**

```bash
npm install -D playwright
npx playwright install chromium
```

- [ ] **Step 3: Add `classify-sites` npm script**

In `package.json`, add to `"scripts"`:

```json
"classify-sites": "tsx scripts/classify-sites.ts"
```

- [ ] **Step 4: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/data/types.ts package.json package-lock.json
git commit -m "feat: add ScrapeMode type, install playwright, add classify-sites script"
```

---

### Task 2: Create the classification script

**Files:**
- Create: `scripts/classify-sites.ts`

- [ ] **Step 1: Create `scripts/classify-sites.ts`**

```typescript
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

const BROWSER_TECHS = new Set(["wix", "wordpress-divi", "wordpress-elementor", "react-spa"])
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
```

- [ ] **Step 2: Run in dry-run mode to verify classification**

```bash
npm run classify-sites -- --dry-run
```

Expected: Each URL prints with detected tech, scrape mode, and body text length. No files modified.

- [ ] **Step 3: Run for real to update websites-data.ts**

```bash
npm run classify-sites
```

Expected: `websites-data.ts` updated with `scrapeMode` and `detectedTech` fields on each entry.

- [ ] **Step 4: Verify the updated file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Spot-check a few entries**

Open `src/data/websites-data.ts` and verify:
- Known Wix sites (e.g. brahmayogaschool.com) are tagged `detectedTech: "wix", scrapeMode: "browser"`
- Known Divi sites (e.g. hiyogacentre.com) are tagged `wordpress-divi` / `browser`
- Known server-rendered sites (e.g. mahiyoga.com) are tagged `wordpress` or `static` / `fetch`

- [ ] **Step 6: Commit**

```bash
git add scripts/classify-sites.ts src/data/websites-data.ts
git commit -m "feat: add site classification script, classify all URLs"
```

---

### Task 3: Add browser fetch to scrape-utils

**Files:**
- Modify: `scripts/scrape-utils.ts`

- [ ] **Step 1: Add `fetchPageTextBrowser()` and `getPageText()` to `scripts/scrape-utils.ts`**

Add these two functions after the existing `fetchPageText()` function:

```typescript
export async function fetchPageTextBrowser(entry: WebsiteEntry): Promise<string | null> {
  try {
    console.log(`Fetching (browser): ${entry.url}`)
    const { chromium } = await import("playwright")
    const browser = await chromium.launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(entry.url, { waitUntil: "networkidle", timeout: 30000 })
      const text = await page.evaluate(() => document.body.innerText)
      const cleaned = text.replace(/\s+/g, " ").trim()
      return cleaned.slice(0, 8000) || null
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.warn(`  ⚠ Failed to fetch (browser) ${entry.url}: ${error}`)
    return null
  }
}

export async function getPageText(entry: WebsiteEntry): Promise<string | null> {
  if (entry.scrapeMode === "browser") {
    return fetchPageTextBrowser(entry)
  }
  return fetchPageText(entry)
}
```

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Quick manual test — browser fetch a known Wix site**

Create a temporary test by running:

```bash
npx tsx -e "
  import { fetchPageTextBrowser } from './scripts/scrape-utils.ts';
  const result = await fetchPageTextBrowser({ schoolName: 'Test', url: 'https://www.brahmayogaschool.com/', location: 'Dharamshala', pageType: 'training', scrapeMode: 'browser' });
  console.log('Length:', result?.length ?? 0);
  console.log('Preview:', result?.slice(0, 300));
"
```

Expected: Prints extracted text content (not empty JS/CSS boilerplate). Length should be well above 200 characters.

- [ ] **Step 4: Commit**

```bash
git add scripts/scrape-utils.ts
git commit -m "feat: add fetchPageTextBrowser and getPageText dispatcher"
```

---

### Task 4: Wire up scrapers to use dual-mode fetch

**Files:**
- Modify: `scripts/scrape-trainings.ts`
- Modify: `scripts/scrape-drop-in.ts`

- [ ] **Step 1: Update `scripts/scrape-trainings.ts`**

Change the import on line 9 — replace `fetchPageText` with `getPageText`:

```typescript
import { anthropic, parseMaxAgeDays, loadExistingData, getUrlsToSkip, getPageText, requireApiKey } from "./scrape-utils"
```

Change line 97 — replace `fetchPageText(entry)` with `getPageText(entry)`:

```typescript
    const text = await getPageText(entry)
```

- [ ] **Step 2: Update `scripts/scrape-drop-in.ts`**

Change the import on line 9 — replace `fetchPageText` with `getPageText`:

```typescript
import { anthropic, parseMaxAgeDays, loadExistingData, getUrlsToSkip, getPageText, requireApiKey } from "./scrape-utils"
```

Change line 111 — replace `fetchPageText(entry)` with `getPageText(entry)`:

```typescript
    const text = await getPageText(entry)
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Test with a small scrape run**

Pick one browser-mode URL and one fetch-mode URL to verify both paths work:

```bash
npm run scrape:trainings -- --update-older-than-days 0
```

Watch the console output — browser-mode URLs should print `Fetching (browser):` and fetch-mode URLs should print `Fetching:`. Both should extract content and pass it to Claude successfully.

- [ ] **Step 5: Verify build still passes**

```bash
npx next build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/scrape-trainings.ts scripts/scrape-drop-in.ts
git commit -m "feat: wire scrapers to use dual-mode getPageText dispatcher"
```
