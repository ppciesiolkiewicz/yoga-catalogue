# Analytics & Contact Form

## Overview

Add PostHog-based analytics (replacing @vercel/analytics) and a contact form for studio owners to request listing on the site. Include a CLI tool for pulling analytics and contact submissions from PostHog.

## 1. PostHog Module — `src/lib/posthog/`

All PostHog client code lives in a dedicated directory with clear separation of concerns.

### `src/lib/posthog/client.ts`

- Exports `getPostHogClient()` — lazily initializes `posthog-js` singleton
- Uses `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` from env
- Returns `null` if env vars are missing (safe for dev/build)
- Config: `autocapture: true`, `capture_pageview: true`, `capture_pageleave: true`, `persistence: "localStorage+cookie"`

### `src/lib/posthog/events.ts`

- Event name constants: `CONTACT_SUBMITTED = "contact_submitted"`
- Typed capture helper:
  ```ts
  function trackContactSubmitted(props: {
    name: string
    email: string
    website: string
    message?: string
  }): void
  ```
- All custom event tracking goes through typed helpers in this file — no raw `posthog.capture()` calls elsewhere in the codebase

### `src/lib/posthog/provider.tsx`

- `"use client"` component
- Calls `getPostHogClient()` inside `useEffect` on mount
- Renders `null` — purely a side-effect component
- Placed in root `layout.tsx`, replacing `<Analytics />`

## 2. Contact Form — `src/app/contact/page.tsx`

Standalone route at `/contact`, not nested under `[location]/`.

### Fields

| Field   | Type     | Required | Notes                                         |
|---------|----------|----------|-----------------------------------------------|
| Name    | text     | yes      | Contact person name                           |
| Email   | email    | yes      | For follow-up                                 |
| Website | url      | yes      | Studio/school website — the primary ask       |
| Message | textarea | no       | Placeholder: "Tell us about your studio..."   |

### Behavior

- Client-side form (`"use client"`)
- On submit: call `trackContactSubmitted(...)` from events module
- Show success message after submission, hide the form
- No server action — data stored entirely in PostHog as event properties
- Basic client-side validation (required fields, email/url format via HTML attributes)

### Styling

- Consistent with existing app: same Tailwind patterns, dark mode support
- Clean, simple layout with the site favicon/branding at top
- Max-width container centered on page

## 3. Contact Link Placement

### Header (`location-header.tsx`)

- Small text link "Add Your Studio" placed next to `<ThemeToggle />` in the `ml-auto` flex container
- Subtle styling — secondary text color, not competing with main navigation tabs
- Links to `/contact`

### Footer (`[location]/layout.tsx`)

- Additional line below copyright: "Want to list your studio? Contact us" where "Contact us" links to `/contact`

## 4. Remove `@vercel/analytics`

- Remove `<Analytics />` import and usage from `src/app/layout.tsx`
- Run `npm uninstall @vercel/analytics`

## 5. CLI Script — `scripts/analytics.mjs`

Adapted from existing project's analytics script. Plain ESM Node.js script (no tsx needed).

### Commands

```
node scripts/analytics.mjs usage    [--days 7]   — pageviews, visitors, key events
node scripts/analytics.mjs contacts  [--days 30]  — contact form submissions
```

### `usage` command

- Fetches `$pageview` events, reports: total pageviews, top pages, unique visitors
- Key events list: `contact_submitted`
- Filters out localhost traffic

### `contacts` command

- Fetches `contact_submitted` events
- Displays: date, name, email, website, message for each submission

### Environment

- New env var: `POSTHOG_PERSONAL_API_KEY` (added to `.env.local`, NOT `.env` — this is a secret server-side key)
- API host: `https://eu.posthog.com` (API host, not ingestion host)
- Add to `.env.example`: `POSTHOG_PERSONAL_API_KEY=` with comment

### Package.json scripts

```json
"analytics": "node scripts/analytics.mjs usage",
"analytics:usage": "node scripts/analytics.mjs usage",
"analytics:contacts": "node scripts/analytics.mjs contacts"
```

## 6. Dependency Changes

- **Add:** `posthog-js`
- **Remove:** `@vercel/analytics`
- **Add (dev):** `dotenv` (for CLI script `.env.local` loading)

## Files Changed/Created

| Action  | Path                              |
|---------|-----------------------------------|
| Create  | `src/lib/posthog/client.ts`       |
| Create  | `src/lib/posthog/events.ts`       |
| Create  | `src/lib/posthog/provider.tsx`    |
| Create  | `src/app/contact/page.tsx`        |
| Create  | `scripts/analytics.mjs`          |
| Modify  | `src/app/layout.tsx`              |
| Modify  | `src/app/[location]/location-header.tsx` |
| Modify  | `src/app/[location]/layout.tsx`   |
| Modify  | `package.json`                    |
| Modify  | `.env.example`                    |
