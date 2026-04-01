# Favicon & Splash Screen Generation

## Overview

A single TypeScript script (`scripts/generate-assets.ts`) that generates all favicon, app icon, and Open Graph images from SVG templates using `sharp`. Follows the existing `scripts/scrape.ts` pattern.

## Design: Lotus Flower

- **Style:** Minimalist, geometric, symmetrical lotus with 7-9 overlapping petals
- **Icon colors:** Pink/magenta gradient (#E91E63 to #F48FB1), transparent background
- **Petal depth:** Slight opacity variation across petals for layered effect
- **Base:** Small curved water element beneath the flower

## Output Files

All written to `public/`:

| File | Size | Format | Purpose |
|------|------|--------|---------|
| `favicon.ico` | 32x32 | ICO | Legacy browser tab icon |
| `favicon.svg` | scalable | SVG | Modern browser tab icon |
| `favicon-16x16.png` | 16x16 | PNG | Small favicon |
| `favicon-32x32.png` | 32x32 | PNG | Standard favicon |
| `apple-touch-icon.png` | 180x180 | PNG | iOS home screen |
| `icon-192x192.png` | 192x192 | PNG | PWA icon |
| `icon-512x512.png` | 512x512 | PNG | PWA splash |
| `og-image.png` | 1200x630 | PNG | Social sharing preview |

## Script Design

### File: `scripts/generate-assets.ts`

**SVG template functions:**

1. `lotusIconSvg(size: number)` — Returns an SVG string of the lotus at the given square size. Transparent background. Used for all icon sizes.
2. `ogImageSvg()` — Returns a 1200x630 SVG with:
   - Dark gradient background (matching site theme)
   - Lotus flower centered/offset
   - "Yoga Courses in Rishikesh" in white text

**ICO generation:**

A small helper function that wraps a 32x32 PNG buffer in the ICO binary format (BMP header in ICO container). No external dependency needed — the ICO format for a single 32x32 image is straightforward.

**Pipeline:**

```
1. Generate lotus SVG at 512px (largest icon size)
2. Use sharp to render SVG → PNG at each required size
3. Generate OG image SVG → PNG via sharp
4. Wrap 32x32 PNG in ICO format
5. Copy raw SVG as favicon.svg
6. Write all files to public/
```

### npm script

Add to `package.json`:
```json
"generate-assets": "tsx scripts/generate-assets.ts"
```

## Integration Changes

### `src/app/layout.tsx`

Add to the existing `metadata` export:

```ts
icons: {
  icon: [
    { url: '/favicon.svg', type: 'image/svg+xml' },
    { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
  ],
  apple: '/apple-touch-icon.png',
},
openGraph: {
  images: [{ url: '/og-image.png', width: 1200, height: 630 }],
},
```

## Cleanup

- Remove `src/app/favicon.ico` (replaced by metadata-driven icons)
- Remove unused default Next.js SVGs from `public/`: `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`

## Dependencies

- **Add:** `sharp` (image processing, SVG → PNG conversion)
- **Existing:** `tsx` (already a devDependency, used to run the script)

## Commit Strategy

Generated assets are committed to `public/` so they deploy without requiring a build-time generation step.
