import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <CourseList courses={courses} />
    </div>
  )
}
