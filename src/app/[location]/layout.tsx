import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { Location } from "@/data/types"
import { LocationHeader } from "./location-header"

const VALID_LOCATIONS: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export function generateStaticParams() {
  return Object.keys(VALID_LOCATIONS).map((location) => ({ location }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>
}): Promise<Metadata> {
  const { location } = await params
  const locationName = VALID_LOCATIONS[location]
  if (!locationName) return {}

  return {
    title: `Yoga in ${locationName}`,
    description: `Browse yoga teacher trainings, retreats and drop-in classes in ${locationName}, India`,
    openGraph: {
      title: `Yoga in ${locationName}`,
      description: `Browse yoga teacher trainings, retreats and drop-in classes in ${locationName}, India`,
      images: [{ url: `/og-${location}.png`, width: 1200, height: 630 }],
    },
  }
}

export default async function LocationLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ location: string }>
}) {
  const { location } = await params
  const locationName = VALID_LOCATIONS[location]
  if (!locationName) notFound()

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <LocationHeader location={location} locationName={locationName} />
      <div className="flex-1">
        {children}
      </div>
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-100 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mx-auto max-w-md text-center text-xs text-zinc-400 dark:text-zinc-500">
          Information may not be fully accurate or up to date. Click on a course or class to verify details on the studio&apos;s website.
        </p>
        <p className="mt-4 text-center text-sm text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} rishikeshyoga.info
        </p>
        <p className="mt-2 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Want to list your studio?{" "}
          <a href="/contact" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">Contact us</a>
        </p>
      </footer>
    </div>
  )
}
