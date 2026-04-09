"use client"

import { useEffect } from "react"
import { getPostHogClient } from "./client"

export function PostHogProvider() {
  useEffect(() => {
    getPostHogClient()
  }, [])

  return null
}
