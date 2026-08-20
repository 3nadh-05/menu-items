export type FoodType = 'veg' | 'non-veg' | 'egg'

export interface CatalogDish {
  name: string
  category: string
  subcategory: string
  type: FoodType
  gst: number
  keywords: string[]
}

export interface Variant {
  id: string
  sizeLabel: string
  price: number
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface Availability {
  allDay: boolean
  startTime: string
  endTime: string
  days: DayOfWeek[]
}

export const DEFAULT_AVAILABILITY: Availability = {
  allDay: true,
  startTime: '09:00',
  endTime: '22:00',
  days: [...ALL_DAYS],
}

export interface Offer {
  type: 'percent' | 'flat'
  value: number
}

export interface MenuItemDraft {
  id: string
  name: string
  price: number
  type: FoodType
  category: string
  subcategory: string
  gst: number
  description: string
  variants: Variant[]
  source: 'catalog' | 'inferred' | 'manual'
  matchConfidence: number
  active: boolean
  availability: Availability
  offer: Offer | null
}
