import { courses } from "@/data"
import type { Location } from "@/data/types"
import { TrainingList } from "./training-list"

const LOCATION_MAP: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export default async function TrainingsPage({
  params,
}: {
  params: Promise<{ location: string }>
}) {
  const { location } = await params
  const locationName = LOCATION_MAP[location]!
  const locationCourses = courses.filter((c) => c.location === locationName)

  return <TrainingList courses={locationCourses} />
}
