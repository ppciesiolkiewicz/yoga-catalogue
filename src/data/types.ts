export interface WebsiteEntry {
  schoolName: string
  url: string
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
}
