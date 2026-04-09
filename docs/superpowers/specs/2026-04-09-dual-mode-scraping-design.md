# Dual-Mode Scraping with Auto-Classification

## Problem

The current scraping pipeline uses `fetch` + Cheerio to extract page text, then sends it to Claude for structured data extraction. This fails for sites using heavy client-side rendering (Wix, Divi, React SPAs) — the raw HTML contains only framework boilerplate, no actual content. As a result, many courses land in "Dates TBD" or are missing entirely.

## Solution

Introduce two scraping modes (`fetch` and `browser`) with an auto-classification script that detects each site's technology stack and assigns the appropriate mode.

## Architecture

### 1. Type Changes — `src/data/types.ts`

```typescript
export type ScrapeMode = "fetch" | "browser"

export interface WebsiteEntry {
  schoolName: string
  url: string
  location: Location
  pageType: PageType
  scrapeMode?: ScrapeMode    // defaults to "fetch" if absent
  detectedTech?: string      // e.g. "wix", "wordpress-divi", "wordpress", "react-spa", "static"
}
```

Both fields are optional so existing data works without changes until classification runs.

### 2. Classification Script — `scripts/classify-sites.ts`

A standalone script that iterates all URLs in `websites-data.ts`, fetches raw HTML, and detects the technology stack.

**Detection heuristics (checked in order):**

| Tech | Indicators |
|------|-----------|
| `wix` | `wix-thunderbolt`, `X-Wix-`, `_wixCIDX`, `wixsite.com` in HTML |
| `wordpress-divi` | `et_builder`, `et-db`, Divi theme references |
| `wordpress-elementor` | `elementor`, `elementor-widget` class names |
| `react-spa` | `<div id="root">` with near-empty body, React bundle patterns |
| `wordpress` | `wp-content`, `wp-includes` (without heavy JS theme) |
| `static` | Plain HTML with no detected framework |

**Scrape mode derivation:**

- `browser` — `wix`, `wordpress-divi`, `wordpress-elementor`, `react-spa`
- `fetch` — `wordpress`, `static`, or anything where Cheerio-extracted body text is >= 200 characters

**Content-length fallback:** Regardless of detected tech, if `body.text()` after stripping scripts/styles is < 200 characters, force `scrapeMode: "browser"`. This catches unknown CSR frameworks.

**Output:** The script rewrites `websites-data.ts` in place, adding `scrapeMode` and `detectedTech` fields to each entry.

**CLI usage:**
```bash
npm run classify-sites                    # classify all URLs
npm run classify-sites -- --dry-run       # print results without writing
```

### 3. Browser Fetch — `scripts/scrape-utils.ts`

Add a `fetchPageTextBrowser()` function alongside existing `fetchPageText()`:

```typescript
async function fetchPageTextBrowser(entry: WebsiteEntry): Promise<string | null> {
  // Lazy-import playwright (only loaded when needed)
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(entry.url, { waitUntil: "networkidle", timeout: 30000 })
  const text = await page.evaluate(() => document.body.innerText)
  await browser.close()
  return text.replace(/\s+/g, " ").trim().slice(0, 8000) || null
}
```

Add a dispatcher function:

```typescript
export async function getPageText(entry: WebsiteEntry): Promise<string | null> {
  if (entry.scrapeMode === "browser") {
    return fetchPageTextBrowser(entry)
  }
  return fetchPageText(entry)
}
```

**Browser lifecycle:** Launch and close per-URL for now (sequential processing). Optimisation to reuse browser instances or parallelise is deferred.

### 4. Scraper Changes

Minimal changes to `scrape-trainings.ts` and `scrape-drop-in.ts`:

Replace:
```typescript
const text = await fetchPageText(entry)
```

With:
```typescript
const text = await getPageText(entry)
```

Import changes from `fetchPageText` to `getPageText`. Everything else stays the same — same Claude prompts, same JSON parsing, same output format.

### 5. Dependencies

Add `playwright` as a dev dependency:
```bash
npm install -D playwright
npx playwright install chromium
```

Only Chromium is needed (not Firefox/WebKit).

### 6. npm Scripts

Add to `package.json`:
```json
"classify-sites": "tsx scripts/classify-sites.ts"
```

## File Changes Summary

| File | Change |
|------|--------|
| `src/data/types.ts` | Add `ScrapeMode` type, add `scrapeMode?` and `detectedTech?` to `WebsiteEntry` |
| `src/data/websites-data.ts` | Add fields to entries (via classify script) |
| `scripts/classify-sites.ts` | New file — classification script |
| `scripts/scrape-utils.ts` | Add `fetchPageTextBrowser()` and `getPageText()` dispatcher |
| `scripts/scrape-trainings.ts` | Replace `fetchPageText` with `getPageText` |
| `scripts/scrape-drop-in.ts` | Replace `fetchPageText` with `getPageText` |
| `package.json` | Add `playwright` dev dep, add `classify-sites` script |

## Out of Scope

- Parallel browser scraping (optimise later)
- Auto-discovery of new yoga school URLs
- Re-running classification automatically on scrape runs
- Headful/debug mode for Playwright
