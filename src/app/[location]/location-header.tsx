"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import type { Location } from "@/data/types"
import { ThemeToggle } from "../theme-toggle"

const LOCATIONS: { slug: string; label: string; subtitle: string }[] = [
  { slug: "rishikesh", label: "Rishikesh", subtitle: "Uttarakhand, India" },
  { slug: "dharamshala", label: "Dharamshala", subtitle: "Himachal Pradesh, India" },
]

const TYPE_TABS = [
  { slug: "trainings", label: "Trainings & Retreats" },
  { slug: "drop-in", label: "Drop-in Classes" },
]

export function LocationHeader({ location, locationName }: { location: string; locationName: Location }) {
  const pathname = usePathname()
  const locationInfo = LOCATIONS.find((l) => l.slug === location)!
  // Determine the current sub-path (trainings or drop-in)
  const currentType = pathname.split("/").pop() ?? "trainings"

  return (
    <header className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500 blur-3xl" />
        <div className="absolute top-8 left-1/2 h-40 w-40 rounded-full bg-teal-500 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Location switcher + theme toggle */}
        <div className="mb-4 flex items-center gap-2">
          {LOCATIONS.map((loc) => (
            <Link
              key={loc.slug}
              href={`/${loc.slug}/${currentType}`}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                location === loc.slug
                  ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-900/10 text-zinc-500 hover:bg-zinc-900/20 hover:text-zinc-700 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20 dark:hover:text-zinc-200"
              }`}
            >
              {loc.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/contact"
              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              + Add Your Studio
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {locationInfo.subtitle}
        </p>
        <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          <img src="/favicon.svg" alt="" className="h-10 w-10 sm:h-12 sm:w-12" />
          Yoga in {locationName}
        </h1>

        {/* Training / Drop-in tabs */}
        <div className="mt-6 flex gap-1">
          {TYPE_TABS.map((tab) => (
            <Link
              key={tab.slug}
              href={`/${location}/${tab.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                currentType === tab.slug
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
