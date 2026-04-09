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
            Want your yoga school or studio listed on rishikeshyoga.info? Share your details and we&apos;ll get you added.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-950">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Thank you!</h2>
            <p className="mt-1 text-emerald-700 dark:text-emerald-300">
              We&apos;ve received your submission and will review it soon.
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
