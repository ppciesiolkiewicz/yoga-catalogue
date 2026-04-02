import { courses } from "@/data/index"
import { CourseList } from "./course-list"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <CourseList courses={courses} />
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-100 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          &copy; {new Date().getFullYear()} rishikeshyoga.info
        </p>
      </footer>
    </div>
  )
}
