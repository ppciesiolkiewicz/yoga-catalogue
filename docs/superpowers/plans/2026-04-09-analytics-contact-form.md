# Analytics & Contact Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Vercel Analytics with PostHog, add a contact form for studio owners, and build a CLI tool to pull analytics data.

**Architecture:** PostHog client code lives in `src/lib/posthog/` with separate files for client init, event constants/helpers, and the provider component. Contact form is a standalone `/contact` route. CLI script is a plain ESM Node.js file using PostHog's REST API.

**Tech Stack:** posthog-js, Next.js 16 App Router, React 19, Tailwind CSS v4, dotenv

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install posthog-js and dotenv, remove @vercel/analytics**

Run:
```bash
npm install posthog-js && npm install -D dotenv && npm uninstall @vercel/analytics
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "require('posthog-js'); console.log('posthog-js OK')"
node -e "require('dotenv'); console.log('dotenv OK')"
```
Expected: Both print OK.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add posthog-js, dotenv; remove @vercel/analytics"
```

---

### Task 2: PostHog Client Module

**Files:**
- Create: `src/lib/posthog/client.ts`

- [ ] **Step 1: Create `src/lib/posthog/client.ts`**

```ts
import posthog from "posthog-js"

let initialized = false

export function getPostHogClient(): typeof posthog | null {
  if (typeof window === "undefined") return null

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key || !host) return null

  if (!initialized) {
    posthog.init(key, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
    })
    initialized = true
  }

  return posthog
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
npx tsc --noEmit src/lib/posthog/client.ts 2>&1 || echo "Check errors above"
```

Note: May need full project typecheck instead. If standalone fails, run `npm run build` at the end of this task to verify.

- [ ] **Step 3: Commit**

```bash
git add src/lib/posthog/client.ts
git commit -m "feat: add PostHog client singleton module"
```

---

### Task 3: PostHog Events Module

**Files:**
- Create: `src/lib/posthog/events.ts`

- [ ] **Step 1: Create `src/lib/posthog/events.ts`**

```ts
import { getPostHogClient } from "./client"

// -- Event name constants --
export const CONTACT_SUBMITTED = "contact_submitted" as const

// -- Typed capture helpers --

interface ContactSubmittedProps {
  name: string
  email: string
  website: string
  message?: string
}

export function trackContactSubmitted(props: ContactSubmittedProps): void {
  const posthog = getPostHogClient()
  if (!posthog) return
  posthog.capture(CONTACT_SUBMITTED, props)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/posthog/events.ts
git commit -m "feat: add PostHog event constants and typed helpers"
```

---

### Task 4: PostHog Provider Component

**Files:**
- Create: `src/lib/posthog/provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/lib/posthog/provider.tsx`**

```tsx
"use client"

import { useEffect } from "react"
import { getPostHogClient } from "./client"

export function PostHogProvider() {
  useEffect(() => {
    getPostHogClient()
  }, [])

  return null
}
```

- [ ] **Step 2: Update root layout — replace Analytics with PostHogProvider**

In `src/app/layout.tsx`:

Remove:
```tsx
import { Analytics } from "@vercel/analytics/react";
```

Add:
```tsx
import { PostHogProvider } from "@/lib/posthog/provider";
```

Replace `<Analytics />` with `<PostHogProvider />` in the JSX body (same position, line 57).

The updated body section should be:
```tsx
<body className="min-h-full flex flex-col">
  {children}
  <PostHogProvider />
</body>
```

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/posthog/provider.tsx src/app/layout.tsx
git commit -m "feat: integrate PostHog provider, remove Vercel Analytics"
```

---

### Task 5: Contact Form Page

**Files:**
- Create: `src/app/contact/page.tsx`

- [ ] **Step 1: Create `src/app/contact/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { trackContactSubmitted } from "@/lib/posthog/events"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    trackContactSubmitted({
      name: data.get("name") as string,
      email: data.get("email") as string,
      website: data.get("website") as string,
      message: (data.get("message") as string) || undefined,
    })

    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-lg px-4 py-16 sm:py-24">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Back to listings
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Add Your Studio</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            Want your yoga school or studio listed on rishikeshyoga.info? Share your details and we'll get you added.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Thank you!</h2>
            <p className="mt-1 text-emerald-700 dark:text-emerald-300">
              We've received your submission and will review it soon.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
            >
              Back to listings
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                placeholder="https://yourstudio.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Message <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                placeholder="Tell us about your studio, the styles you teach, and any courses or drop-in classes you offer..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds. The `/contact` route should appear in the build output.

- [ ] **Step 3: Commit**

```bash
git add src/app/contact/page.tsx
git commit -m "feat: add contact form page for studio submissions"
```

---

### Task 6: Add Contact Links to Header and Footer

**Files:**
- Modify: `src/app/[location]/location-header.tsx`
- Modify: `src/app/[location]/layout.tsx`

- [ ] **Step 1: Add "Add Your Studio" link to header**

In `src/app/[location]/location-header.tsx`, find the `ml-auto` div that wraps `<ThemeToggle />` (line 47-49):

```tsx
<div className="ml-auto">
  <ThemeToggle />
</div>
```

Replace with:

```tsx
<div className="ml-auto flex items-center gap-1">
  <Link
    href="/contact"
    className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
  >
    Add Your Studio
  </Link>
  <ThemeToggle />
</div>
```

- [ ] **Step 2: Add contact link to footer**

In `src/app/[location]/layout.tsx`, find the footer (lines 33-36):

```tsx
<footer className="mt-auto border-t border-zinc-200 bg-zinc-100 py-6 dark:border-zinc-800 dark:bg-zinc-900">
  <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
    &copy; {new Date().getFullYear()} rishikeshyoga.info
  </p>
</footer>
```

Replace with:

```tsx
<footer className="mt-auto border-t border-zinc-200 bg-zinc-100 py-6 dark:border-zinc-800 dark:bg-zinc-900">
  <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
    &copy; {new Date().getFullYear()} rishikeshyoga.info
  </p>
  <p className="mt-2 text-center text-sm text-zinc-400 dark:text-zinc-500">
    Want to list your studio?{" "}
    <a href="/contact" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">Contact us</a>
  </p>
</footer>
```

- [ ] **Step 3: Verify build**

Run:
```bash
npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/[location]/location-header.tsx src/app/[location]/layout.tsx
git commit -m "feat: add contact form links to header and footer"
```

---

### Task 7: CLI Analytics Script

**Files:**
- Create: `scripts/analytics.mjs`
- Modify: `package.json` (scripts section)
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**

Add to the end of `.env.example`:

```
# Analytics CLI (server-side, keep in .env.local)
POSTHOG_PERSONAL_API_KEY=
```

- [ ] **Step 2: Create `scripts/analytics.mjs`**

```js
#!/usr/bin/env node

/**
 * CLI tool for pulling PostHog analytics data.
 *
 * Usage:
 *   node scripts/analytics.mjs usage    [--days 7]   — pageviews, visitors, key events
 *   node scripts/analytics.mjs contacts  [--days 30]  — contact form submissions
 *
 * Requires POSTHOG_PERSONAL_API_KEY in .env.local
 * Get one from PostHog → Settings → Personal API Keys
 */

import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const API_HOST = "https://eu.posthog.com";

if (!API_KEY) {
  console.error(
    "Missing POSTHOG_PERSONAL_API_KEY in .env.local\n" +
      "Get one from PostHog → Settings → Personal API Keys"
  );
  process.exit(1);
}

// --- API helpers ---

async function fetchPostHog(endpoint, params = {}) {
  const url = new URL(endpoint, API_HOST);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostHog API ${res.status}: ${body}`);
  }
  return res.json();
}

async function getProjectId() {
  const data = await fetchPostHog("/api/projects/");
  if (!data.results?.length) throw new Error("No PostHog projects found");
  return data.results[0].id;
}

async function fetchAllEvents(projectId, eventName, after) {
  const events = [];
  let url = `/api/projects/${projectId}/events/`;
  let params = { event: eventName, after, limit: "100", orderBy: '["-timestamp"]' };

  while (true) {
    const data = await fetchPostHog(url, params);
    events.push(...(data.results || []));
    if (!data.next) break;
    const nextUrl = new URL(data.next);
    url = nextUrl.pathname;
    params = Object.fromEntries(nextUrl.searchParams);
  }
  return events.filter((e) => !isLocalhost(e));
}

function isLocalhost(event) {
  const url = event.properties?.$current_url || "";
  return url.includes("localhost") || url.includes("127.0.0.1");
}

// --- Commands ---

async function cmdUsage(days) {
  const projectId = await getProjectId();
  const after = daysAgo(days);

  console.log(`\nUsage stats — last ${days} days\n${"─".repeat(40)}`);

  const pageviews = await fetchAllEvents(projectId, "$pageview", after);
  console.log(`\nPageviews: ${pageviews.length}`);

  const pageCounts = {};
  for (const e of pageviews) {
    const page = e.properties?.$pathname || "unknown";
    pageCounts[page] = (pageCounts[page] || 0) + 1;
  }
  const sortedPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]);
  console.log("\nTop pages:");
  for (const [page, count] of sortedPages.slice(0, 15)) {
    console.log(`  ${String(count).padStart(5)}  ${page}`);
  }

  const uniqueVisitors = new Set(pageviews.map((e) => e.distinct_id));
  console.log(`\nUnique visitors: ${uniqueVisitors.size}`);

  const keyEvents = ["contact_submitted"];

  console.log("\nKey events:");
  for (const eventName of keyEvents) {
    const events = await fetchAllEvents(projectId, eventName, after);
    if (events.length > 0) {
      console.log(`  ${String(events.length).padStart(5)}  ${eventName}`);
    }
  }

  console.log("");
}

async function cmdContacts(days) {
  const projectId = await getProjectId();
  const after = daysAgo(days);

  console.log(`\nContact submissions — last ${days} days\n${"─".repeat(40)}\n`);

  const events = await fetchAllEvents(projectId, "contact_submitted", after);

  if (events.length === 0) {
    console.log("No contact submissions found.");
    return;
  }

  for (const e of events) {
    const date = new Date(e.timestamp).toLocaleString();
    const name = e.properties?.name || "—";
    const email = e.properties?.email || "—";
    const website = e.properties?.website || "—";
    const message = e.properties?.message || "—";
    console.log(`Date:    ${date}`);
    console.log(`Name:    ${name}`);
    console.log(`Email:   ${email}`);
    console.log(`Website: ${website}`);
    console.log(`Message: ${message}`);
    console.log("─".repeat(40));
  }

  console.log(`\nTotal: ${events.length} submission(s)\n`);
}

// --- Helpers ---

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const KNOWN_FLAGS = new Set(["--days"]);

function showHelp(exitCode = 0) {
  console.log(
    "Usage:\n" +
      "  node scripts/analytics.mjs usage    [--days 7]   — pageviews, visitors, key events\n" +
      "  node scripts/analytics.mjs contacts  [--days 30]  — contact form submissions"
  );
  process.exit(exitCode);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];

  const flags = args.filter((a) => a.startsWith("--"));
  const unknown = flags.filter((f) => !KNOWN_FLAGS.has(f));
  if (unknown.length > 0) {
    console.error(`Unknown flag(s): ${unknown.join(", ")}\n`);
    showHelp(1);
  }

  let days = 7;
  const daysIdx = args.indexOf("--days");
  if (daysIdx !== -1 && args[daysIdx + 1]) {
    days = parseInt(args[daysIdx + 1], 10);
  }
  return { command, days };
}

// --- Main ---

const { command, days } = parseArgs();

switch (command) {
  case "usage":
    await cmdUsage(days);
    break;
  case "contacts":
    await cmdContacts(days);
    break;
  default:
    showHelp(command ? 1 : 0);
}
```

- [ ] **Step 3: Add npm scripts to `package.json`**

Add these to the `"scripts"` section in `package.json`:

```json
"analytics": "node scripts/analytics.mjs usage",
"analytics:usage": "node scripts/analytics.mjs usage",
"analytics:contacts": "node scripts/analytics.mjs contacts"
```

- [ ] **Step 4: Verify script parses correctly**

Run:
```bash
node scripts/analytics.mjs
```
Expected: Prints the help/usage text (not an error).

- [ ] **Step 5: Commit**

```bash
git add scripts/analytics.mjs package.json .env.example
git commit -m "feat: add PostHog analytics CLI script"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full build check**

Run:
```bash
npm run build
```
Expected: Build succeeds with no errors. Routes should include `/contact`.

- [ ] **Step 2: Manual smoke test**

Run:
```bash
npm run dev
```

Verify in browser:
1. Visit `http://localhost:3000` — redirects to `/rishikesh/trainings`, PostHog loads in network tab
2. Header shows "Add Your Studio" link next to theme toggle
3. Footer shows "Want to list your studio? Contact us" link
4. Click "Add Your Studio" → navigates to `/contact`
5. Fill out form, submit → shows success message
6. Check browser console / network tab for PostHog `contact_submitted` event

- [ ] **Step 3: Commit any fixes if needed**
