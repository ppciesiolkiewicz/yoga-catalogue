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
