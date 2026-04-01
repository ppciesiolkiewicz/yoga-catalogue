import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-zinc-900 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Yoga Courses in Rishikesh
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {courses.length} courses from {new Set(courses.map((c) => c.schoolName)).size} schools
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <CourseList courses={courses} />
      </main>
    </div>
  )
}
