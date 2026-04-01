import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="relative overflow-hidden bg-zinc-900 dark:bg-zinc-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500 blur-3xl" />
          <div className="absolute top-8 left-1/2 h-40 w-40 rounded-full bg-teal-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
            Rishikesh, India
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Yoga Teacher Training
          </h1>
          <p className="mt-3 text-base text-zinc-400">
            <span className="text-white font-semibold">{courses.length}</span> courses from{" "}
            <span className="text-white font-semibold">{new Set(courses.map((c) => c.schoolName)).size}</span> schools
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <CourseList courses={courses} />
      </main>
    </div>
  )
}
