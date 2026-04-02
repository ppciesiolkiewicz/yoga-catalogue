export type Location = "Rishikesh" | "Dharamshala"

export type PageType = "training" | "drop-in"

export type TagCategory = "style" | "certification" | "duration"

export interface Tag {
  label: string
  category: TagCategory
}

export interface WebsiteEntry {
  schoolName: string
  url: string
  location: Location
  pageType: PageType
}

export interface YogaCourse {
  schoolName: string
  courseName: string
  url: string
  type: string
  certificationLevel: string
  durationDays: number
  price: {
    amount: number
    currency: string
  }
  description: string
  upcomingDates: string[]
  accommodation: boolean | string
  meals: boolean | string
  rating: number | null
  reviewCount: number | null
  tags: Tag[]
  location: Location
  updatedAt: string
}

export interface DropInClass {
  schoolName: string
  className: string
  url: string
  style: string
  schedule: {
    dayOfWeek: number
    startTime: string
    endTime?: string
  }[]
  price?: { amount: number; currency: string }
  description: string
  location: Location
  tags: Tag[]
  updatedAt: string
}
