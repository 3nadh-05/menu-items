import { CATALOG, CATEGORY_DEFAULT_GST } from '../data/catalog'
import type { CatalogDish, FoodType } from '../types'

export interface Suggestion {
  type: FoodType
  category: string
  subcategory: string
  gst: number
  source: 'catalog' | 'inferred' | 'manual'
  confidence: number
  matchedDish?: CatalogDish
}

const MANUAL_FALLBACK: Suggestion = {
  type: 'veg',
  category: 'Main Course',
  subcategory: 'Veg Curries',
  gst: 5,
  source: 'manual',
  confidence: 0,
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/** Keyword → category map used only when nothing in the catalog matches closely. */
const CATEGORY_KEYWORDS: Array<{ category: string; subcategory: string; words: string[] }> = [
  { category: 'Biryani & Rice', subcategory: 'Biryani', words: ['biryani', 'biriyani', 'pulao', 'pilaf'] },
  { category: 'South Indian', subcategory: 'Dosa', words: ['dosa', 'idli', 'vada', 'uttapam', 'pongal', 'sambar'] },
  { category: 'Breads', subcategory: 'Roti', words: ['naan', 'roti', 'paratha', 'kulcha', 'bhatura', 'phulka'] },
  { category: 'Chinese', subcategory: 'Rice & Noodles', words: ['noodles', 'manchurian', 'chowmein', 'hakka', 'schezwan', 'szechwan'] },
  { category: 'Desserts', subcategory: 'Indian Sweets', words: ['jamun', 'rasmalai', 'kulfi', 'halwa', 'kheer', 'barfi', 'cake', 'brownie', 'mousse', 'pudding'] },
  { category: 'Beverages', subcategory: 'Tea & Coffee', words: ['juice', 'shake', 'lassi', 'chai', 'coffee', 'soda', 'mocktail', 'smoothie', 'tea'] },
  { category: 'Starters', subcategory: 'Non-Veg Starters', words: ['tikka', 'kebab', 'kabab', 'lollipop', '65', 'fry', 'roll', 'pakora', 'cutlet', 'starter'] },
  { category: 'Main Course', subcategory: 'Veg Curries', words: ['curry', 'masala', 'gravy', 'kurma', 'korma', 'sabzi', 'dal', 'kofta'] },
]

const NON_VEG_WORDS = ['chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 'meat', 'keema', 'kheema', 'crab', 'lamb', 'goat', 'seafood', 'squid', 'liver']
const EGG_WORDS = ['egg', 'omelette', 'omelet']

function inferType(tokens: string[]): FoodType {
  if (tokens.some((t) => NON_VEG_WORDS.includes(t))) return 'non-veg'
  if (tokens.some((t) => EGG_WORDS.includes(t))) return 'egg'
  return 'veg'
}

function inferCategory(tokens: string[]): { category: string; subcategory: string } | null {
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some((w) => tokens.includes(w))) {
      return { category: entry.category, subcategory: entry.subcategory }
    }
  }
  return null
}

function scoreDish(tokens: string[], dish: CatalogDish): number {
  const dishTokens = tokenize(dish.name)
  const allKeywords = Array.from(new Set([...dishTokens, ...dish.keywords]))
  const hits = allKeywords.filter((k) => tokens.includes(k)).length
  if (hits === 0) return 0
  // Reward covering more of the dish's identity and more of what the user typed.
  const dishCoverage = hits / allKeywords.length
  const queryCoverage = hits / tokens.length
  return dishCoverage * 0.6 + queryCoverage * 0.4
}

/**
 * Given a free-typed item name, returns the best-guess type/category/GST —
 * exactly what a merchant on Swiggy/Zomato sees pre-filled the moment they
 * stop typing. Catalog match wins when confident; otherwise falls back to
 * lightweight keyword inference; otherwise a safe manual default.
 */
export function suggestFor(name: string): Suggestion {
  const trimmed = name.trim()
  if (!trimmed) return MANUAL_FALLBACK

  const tokens = tokenize(trimmed)

  const exact = CATALOG.find((d) => d.name.toLowerCase() === trimmed.toLowerCase())
  if (exact) {
    return {
      type: exact.type,
      category: exact.category,
      subcategory: exact.subcategory,
      gst: exact.gst,
      source: 'catalog',
      confidence: 1,
      matchedDish: exact,
    }
  }

  let best: { dish: CatalogDish; score: number } | null = null
  for (const dish of CATALOG) {
    const score = scoreDish(tokens, dish)
    if (score > 0 && (!best || score > best.score)) best = { dish, score }
  }
  if (best && best.score >= 0.35) {
    return {
      type: best.dish.type,
      category: best.dish.category,
      subcategory: best.dish.subcategory,
      gst: best.dish.gst,
      source: 'catalog',
      confidence: Math.min(0.95, best.score),
      matchedDish: best.dish,
    }
  }

  const categoryGuess = inferCategory(tokens)
  const type = inferType(tokens)
  if (categoryGuess) {
    return {
      type,
      category: categoryGuess.category,
      subcategory: categoryGuess.subcategory,
      gst: CATEGORY_DEFAULT_GST[categoryGuess.category] ?? 5,
      source: 'inferred',
      confidence: 0.55,
    }
  }

  // No category signal at all, but we can still read veg/non-veg off the name.
  if (type !== 'veg') {
    return { ...MANUAL_FALLBACK, type, source: 'inferred', confidence: 0.3 }
  }

  return MANUAL_FALLBACK
}

export function autocomplete(query: string, limit = 6): CatalogDish[] {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length < 2) return []
  const starts = CATALOG.filter((d) => d.name.toLowerCase().startsWith(trimmed))
  const contains = CATALOG.filter((d) => !d.name.toLowerCase().startsWith(trimmed) && d.name.toLowerCase().includes(trimmed))
  return [...starts, ...contains].slice(0, limit)
}
