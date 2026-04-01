import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Yoga Courses in Rishikesh
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
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
