import sharp from "sharp"
import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, "../public")

// ── SVG Templates ──────────────────────────────────────────────

function lotusIconSvg(size: number): string {
  // Viewbox is always 100x100, scaled to requested size
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="petalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F48FB1"/>
      <stop offset="100%" stop-color="#E91E63"/>
    </linearGradient>
  </defs>
  <!-- Center petal -->
  <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGrad)" opacity="0.95"/>
  <!-- Inner left petals -->
  <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGrad)" opacity="0.85" transform="rotate(-25 50 55)"/>
  <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGrad)" opacity="0.85" transform="rotate(25 50 55)"/>
  <!-- Mid left/right petals -->
  <ellipse cx="50" cy="38" rx="7" ry="20" fill="url(#petalGrad)" opacity="0.7" transform="rotate(-50 50 55)"/>
  <ellipse cx="50" cy="38" rx="7" ry="20" fill="url(#petalGrad)" opacity="0.7" transform="rotate(50 50 55)"/>
  <!-- Outer petals -->
  <ellipse cx="50" cy="40" rx="6" ry="18" fill="url(#petalGrad)" opacity="0.55" transform="rotate(-72 50 55)"/>
  <ellipse cx="50" cy="40" rx="6" ry="18" fill="url(#petalGrad)" opacity="0.55" transform="rotate(72 50 55)"/>
  <!-- Water base -->
  <path d="M 28 68 Q 50 60 72 68 Q 50 74 28 68 Z" fill="#E91E63" opacity="0.4"/>
  <path d="M 32 72 Q 50 66 68 72 Q 50 77 32 72 Z" fill="#E91E63" opacity="0.25"/>
</svg>`
}

function ogImageSvg(location: string): string {
  // Embed the lotus inline at a fixed position, add title text
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="petalGradOg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F48FB1"/>
      <stop offset="100%" stop-color="#E91E63"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>
  <!-- Lotus flower — centered at (600, 240), scaled 2.5x from 100x100 viewbox -->
  <g transform="translate(475, 115) scale(2.5)">
    <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGradOg)" opacity="0.95"/>
    <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGradOg)" opacity="0.85" transform="rotate(-25 50 55)"/>
    <ellipse cx="50" cy="38" rx="8" ry="22" fill="url(#petalGradOg)" opacity="0.85" transform="rotate(25 50 55)"/>
    <ellipse cx="50" cy="38" rx="7" ry="20" fill="url(#petalGradOg)" opacity="0.7" transform="rotate(-50 50 55)"/>
    <ellipse cx="50" cy="38" rx="7" ry="20" fill="url(#petalGradOg)" opacity="0.7" transform="rotate(50 50 55)"/>
    <ellipse cx="50" cy="40" rx="6" ry="18" fill="url(#petalGradOg)" opacity="0.55" transform="rotate(-72 50 55)"/>
    <ellipse cx="50" cy="40" rx="6" ry="18" fill="url(#petalGradOg)" opacity="0.55" transform="rotate(72 50 55)"/>
    <path d="M 28 68 Q 50 60 72 68 Q 50 74 28 68 Z" fill="#E91E63" opacity="0.4"/>
    <path d="M 32 72 Q 50 66 68 72 Q 50 77 32 72 Z" fill="#E91E63" opacity="0.25"/>
  </g>
  <!-- Title text -->
  <text x="600" y="440" text-anchor="middle" font-family="system-ui, sans-serif" font-size="52" font-weight="700" fill="white">Yoga in ${location}</text>
  <!-- Subtitle -->
  <text x="600" y="490" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#94a3b8">Browse yoga teacher trainings &amp; retreats</text>
</svg>`
}

// ── ICO Generation ─────────────────────────────────────────────

function pngToIco(pngBuffer: Buffer): Buffer {
  // ICO format: 6-byte header + 16-byte directory entry + PNG data
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // type: 1 = ICO
  header.writeUInt16LE(1, 4)      // count: 1 image

  const dirEntry = Buffer.alloc(16)
  dirEntry.writeUInt8(32, 0)      // width (32 = 32px)
  dirEntry.writeUInt8(32, 1)      // height
  dirEntry.writeUInt8(0, 2)       // color palette
  dirEntry.writeUInt8(0, 3)       // reserved
  dirEntry.writeUInt16LE(1, 4)    // color planes
  dirEntry.writeUInt16LE(32, 6)   // bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8)  // image size
  dirEntry.writeUInt32LE(22, 12)  // offset to image data (6 + 16 = 22)

  return Buffer.concat([header, dirEntry, pngBuffer])
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  mkdirSync(publicDir, { recursive: true })

  const iconSizes = [
    { name: "favicon-16x16.png", size: 16 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "icon-192x192.png", size: 192 },
    { name: "icon-512x512.png", size: 512 },
  ]

  // Generate all icon PNGs
  const pngBuffers = new Map<string, Buffer>()
  for (const { name, size } of iconSizes) {
    const svg = lotusIconSvg(size)
    const png = await sharp(Buffer.from(svg)).png().toBuffer()
    pngBuffers.set(name, png)
    writeFileSync(join(publicDir, name), png)
    console.log(`✓ ${name} (${size}x${size})`)
  }

  // Generate favicon.ico from 32x32 PNG
  const png32 = pngBuffers.get("favicon-32x32.png")!
  const ico = pngToIco(png32)
  writeFileSync(join(publicDir, "favicon.ico"), ico)
  console.log("✓ favicon.ico (32x32)")

  // Write favicon.svg
  const svgContent = lotusIconSvg(100)
  writeFileSync(join(publicDir, "favicon.svg"), svgContent)
  console.log("✓ favicon.svg")

  // Generate per-location OG images
  const locations = ["Rishikesh", "Dharamshala"]
  for (const location of locations) {
    const ogSvg = ogImageSvg(location)
    const ogPng = await sharp(Buffer.from(ogSvg)).png().toBuffer()
    const slug = location.toLowerCase()
    writeFileSync(join(publicDir, `og-${slug}.png`), ogPng)
    console.log(`✓ og-${slug}.png (1200x630)`)
  }

  // Generate generic fallback OG image
  const ogFallbackSvg = ogImageSvg("India")
  const ogFallbackPng = await sharp(Buffer.from(ogFallbackSvg)).png().toBuffer()
  writeFileSync(join(publicDir, "og-image.png"), ogFallbackPng)
  console.log("✓ og-image.png (1200x630)")

  console.log("\nAll assets generated in public/")
}

main().catch((err) => {
  console.error("Failed to generate assets:", err)
  process.exit(1)
})
