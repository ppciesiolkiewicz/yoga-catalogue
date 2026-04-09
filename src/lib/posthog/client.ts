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
