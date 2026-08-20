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
}
