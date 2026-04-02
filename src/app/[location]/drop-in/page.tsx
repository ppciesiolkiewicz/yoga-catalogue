import { dropInClasses } from "@/data"
import type { Location } from "@/data/types"
import { DropInList } from "./drop-in-list"

const LOCATION_MAP: Record<string, Location> = {
  rishikesh: "Rishikesh",
  dharamshala: "Dharamshala",
}

export default async function DropInPage(props: PageProps<"/[location]/drop-in">) {
  const { location } = await props.params
  const locationName = LOCATION_MAP[location]!
  const locationClasses = dropInClasses.filter((c) => c.location === locationName)

  return <DropInList classes={locationClasses} />
}
