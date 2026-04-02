import { redirect } from "next/navigation"

export default async function LocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params
  redirect(`/${location}/trainings`)
}
