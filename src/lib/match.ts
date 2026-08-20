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

/** Naive English stemmer — enough to fold "idlis"→"idli", "curries"→"curry", "fries"→"fry". */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem)
}

function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Classic edit distance, used to tolerate typos in a typed dish name. */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 0; i <= a.length; i++) dp[i][0] = i
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

function nameSimilarity(query: string, dishName: string): number {
  const a = squash(query)
  const b = squash(dishName)
  if (!a || !b) return 0
  if (a === b) return 1
  if (b.startsWith(a) || a.startsWith(b)) return 0.9
  if (b.includes(a) || a.includes(b)) return 0.8
  const dist = levenshtein(a, b)
  return Math.max(0, 1 - dist / Math.max(a.length, b.length))
}

/** Keyword → category map used only when nothing in the catalog matches closely. */
const CATEGORY_KEYWORDS: Array<{ category: string; subcategory: string; words: string[] }> = [
  { category: 'Breakfast', subcategory: 'North Indian Breakfast', words: ['poha', 'upma', 'paratha', 'bhature', 'bhatura', 'breakfast'] },
  { category: 'Biryani & Rice', subcategory: 'Biryani', words: ['biryani', 'biriyani', 'pulao', 'pilaf'] },
  { category: 'South Indian', subcategory: 'Dosa', words: ['dosa', 'idli', 'vada', 'uttapam', 'pongal', 'sambar'] },
  { category: 'Breads', subcategory: 'Roti', words: ['naan', 'roti', 'kulcha', 'phulka'] },
  { category: 'Chinese', subcategory: 'Rice & Noodles', words: ['noodle', 'manchurian', 'chowmein', 'hakka', 'schezwan', 'szechwan'] },
  { category: 'Fast Food', subcategory: 'Burgers', words: ['burger', 'pizza', 'sandwich', 'pasta', 'momo', 'shawarma', 'frankie', 'fries', 'wrap'] },
  { category: 'Desserts', subcategory: 'Indian Sweets', words: ['jamun', 'rasmalai', 'kulfi', 'halwa', 'kheer', 'barfi', 'cake', 'brownie', 'mousse', 'pudding'] },
  { category: 'Beverages', subcategory: 'Tea & Coffee', words: ['juice', 'shake', 'lassi', 'chai', 'coffee', 'soda', 'mocktail', 'smoothie', 'tea', 'drink'] },
  { category: 'Starters', subcategory: 'Non-Veg Starters', words: ['tikka', 'kebab', 'kabab', 'lollipop', '65', 'fry', 'roll', 'pakora', 'cutlet', 'starter'] },
  { category: 'Main Course', subcategory: 'Veg Curries', words: ['curry', 'masala', 'gravy', 'kurma', 'korma', 'sabzi', 'dal', 'kofta'] },
]

const NON_VEG_WORDS = ['chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 'meat', 'keema', 'kheema', 'crab', 'lamb', 'goat', 'seafood', 'squid', 'liver']
const EGG_WORDS = ['egg', 'omelette', 'omelet']

function inferType(tokens: string[]): FoodType {
  if (tokens.some((t) => NON_VEG_WORDS.includes(t) || NON_VEG_WORDS.includes(stem(t)))) return 'non-veg'
  if (tokens.some((t) => EGG_WORDS.includes(t))) return 'egg'
  return 'veg'
}

function inferCategory(tokens: string[]): { category: string; subcategory: string } | null {
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.words.some((w) => tokens.includes(w) || tokens.includes(stem(w)))) {
      return { category: entry.category, subcategory: entry.subcategory }
    }
  }
  return null
}

function scoreDish(tokens: string[], query: string, dish: CatalogDish): number {
  const dishTokens = tokenize(dish.name)
  const allKeywords = Array.from(new Set([...dishTokens, ...dish.keywords.map(stem)]))
  const hits = allKeywords.filter((k) => tokens.includes(k)).length
  const dishCoverage = hits / allKeywords.length
  const queryCoverage = hits / Math.max(1, tokens.length)
  const keywordScore = hits > 0 ? dishCoverage * 0.6 + queryCoverage * 0.4 : 0

  // Typo/partial tolerance: compare the raw typed name to the dish name directly,
  // so "chiken biriyani" or "biryani" alone still lands on the right dish.
  const nameScore = nameSimilarity(query, dish.name)

  return Math.max(keywordScore, nameScore * 0.9)
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

  let best: { dish: CatalogDish; score: number } | null = null
  for (const dish of CATALOG) {
    const score = scoreDish(tokens, trimmed, dish)
    if (score > 0 && (!best || score > best.score)) best = { dish, score }
  }
  if (best && best.score >= 0.55) {
    return {
      type: best.dish.type,
      category: best.dish.category,
      subcategory: best.dish.subcategory,
      gst: best.dish.gst,
      source: 'catalog',
      confidence: Math.min(0.97, best.score),
      matchedDish: best.dish,
    }
  }
  if (best && best.score >= 0.3) {
    return {
      type: best.dish.type,
      category: best.dish.category,
      subcategory: best.dish.subcategory,
      gst: best.dish.gst,
      source: 'catalog',
      confidence: best.score,
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
  if (starts.length + contains.length >= limit) return [...starts, ...contains].slice(0, limit)

  // Nothing textually contains the query (likely a typo) — fall back to fuzzy ranking.
  const ranked = CATALOG.map((d) => ({ d, s: nameSimilarity(trimmed, d.name) }))
    .filter((r) => r.s >= 0.55)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.d)
  const seen = new Set([...starts, ...contains].map((d) => d.name))
  return [...starts, ...contains, ...ranked.filter((d) => !seen.has(d.name))].slice(0, limit)
}
