import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Yoga Courses in Rishikesh
          </h1>
          <p className="mt-2 text-sm text-emerald-100/80">
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
