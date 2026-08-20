import type { CatalogDish } from '../types'

/**
 * Mocked master dish catalog — stands in for the shared taxonomy Swiggy/Zomato
 * maintain centrally (thousands of known dishes, pre-tagged with category,
 * type and tax slab) so a merchant rarely types a dish the platform hasn't
 * already seen. In production this would be a backend-owned, searchable
 * service (Elasticsearch/pgvector) instead of a bundled array.
 */
export const CATALOG: CatalogDish[] = [
  // Biryani & Rice
  { name: 'Chicken Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'non-veg', gst: 5, keywords: ['chicken', 'biryani'] },
  { name: 'Mutton Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'non-veg', gst: 5, keywords: ['mutton', 'biryani'] },
  { name: 'Egg Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'egg', gst: 5, keywords: ['egg', 'biryani'] },
  { name: 'Veg Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'veg', gst: 5, keywords: ['veg', 'biryani', 'vegetable'] },
  { name: 'Paneer Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'veg', gst: 5, keywords: ['paneer', 'biryani'] },
  { name: 'Fish Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'non-veg', gst: 5, keywords: ['fish', 'biryani'] },
  { name: 'Prawn Biryani', category: 'Biryani & Rice', subcategory: 'Biryani', type: 'non-veg', gst: 5, keywords: ['prawn', 'shrimp', 'biryani'] },
  { name: 'Jeera Rice', category: 'Biryani & Rice', subcategory: 'Rice', type: 'veg', gst: 5, keywords: ['jeera', 'rice', 'cumin'] },
  { name: 'Curd Rice', category: 'Biryani & Rice', subcategory: 'Rice', type: 'veg', gst: 5, keywords: ['curd', 'rice', 'yogurt'] },
  { name: 'Ghee Rice', category: 'Biryani & Rice', subcategory: 'Rice', type: 'veg', gst: 5, keywords: ['ghee', 'rice'] },

  // Starters
  { name: 'Chicken 65', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['chicken', '65'] },
  { name: 'Chilli Chicken', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['chilli', 'chicken'] },
  { name: 'Chicken Lollipop', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['chicken', 'lollipop'] },
  { name: 'Tandoori Chicken', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['tandoori', 'chicken'] },
  { name: 'Chicken Tikka', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['chicken', 'tikka'] },
  { name: 'Seekh Kebab', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['seekh', 'kebab', 'kabab'] },
  { name: 'Fish Fry', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['fish', 'fry'] },
  { name: 'Prawn Fry', category: 'Starters', subcategory: 'Non-Veg Starters', type: 'non-veg', gst: 5, keywords: ['prawn', 'fry', 'shrimp'] },
  { name: 'Paneer Tikka', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['paneer', 'tikka'] },
  { name: 'Gobi Manchurian', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['gobi', 'manchurian', 'cauliflower'] },
  { name: 'Veg Spring Roll', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['spring', 'roll', 'veg'] },
  { name: 'Mushroom 65', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['mushroom', '65'] },
  { name: 'Corn Chaat', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['corn', 'chaat'] },
  { name: 'Papad', category: 'Starters', subcategory: 'Veg Starters', type: 'veg', gst: 5, keywords: ['papad', 'papadum'] },

  // Main Course
  { name: 'Butter Chicken', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'non-veg', gst: 5, keywords: ['butter', 'chicken', 'makhani'] },
  { name: 'Chicken Curry', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'non-veg', gst: 5, keywords: ['chicken', 'curry'] },
  { name: 'Mutton Curry', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'non-veg', gst: 5, keywords: ['mutton', 'curry'] },
  { name: 'Chicken Chettinad', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'non-veg', gst: 5, keywords: ['chicken', 'chettinad'] },
  { name: 'Fish Curry', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'non-veg', gst: 5, keywords: ['fish', 'curry'] },
  { name: 'Egg Curry', category: 'Main Course', subcategory: 'Non-Veg Curries', type: 'egg', gst: 5, keywords: ['egg', 'curry'] },
  { name: 'Paneer Butter Masala', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['paneer', 'butter', 'masala'] },
  { name: 'Paneer Tikka Masala', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['paneer', 'tikka', 'masala'] },
  { name: 'Dal Tadka', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['dal', 'tadka', 'lentil'] },
  { name: 'Dal Makhani', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['dal', 'makhani', 'lentil'] },
  { name: 'Chana Masala', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['chana', 'chole', 'masala', 'chickpea'] },
  { name: 'Palak Paneer', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['palak', 'paneer', 'spinach'] },
  { name: 'Mixed Veg Curry', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['mixed', 'veg', 'curry', 'vegetable'] },
  { name: 'Malai Kofta', category: 'Main Course', subcategory: 'Veg Curries', type: 'veg', gst: 5, keywords: ['malai', 'kofta'] },

  // Breads
  { name: 'Butter Naan', category: 'Breads', subcategory: 'Naan', type: 'veg', gst: 5, keywords: ['naan', 'butter'] },
  { name: 'Garlic Naan', category: 'Breads', subcategory: 'Naan', type: 'veg', gst: 5, keywords: ['naan', 'garlic'] },
  { name: 'Tandoori Roti', category: 'Breads', subcategory: 'Roti', type: 'veg', gst: 5, keywords: ['roti', 'tandoori'] },
  { name: 'Lachha Paratha', category: 'Breads', subcategory: 'Paratha', type: 'veg', gst: 5, keywords: ['paratha', 'lachha'] },
  { name: 'Plain Paratha', category: 'Breads', subcategory: 'Paratha', type: 'veg', gst: 5, keywords: ['paratha', 'plain'] },

  // South Indian
  { name: 'Masala Dosa', category: 'South Indian', subcategory: 'Dosa', type: 'veg', gst: 5, keywords: ['dosa', 'masala'] },
  { name: 'Plain Dosa', category: 'South Indian', subcategory: 'Dosa', type: 'veg', gst: 5, keywords: ['dosa', 'plain'] },
  { name: 'Rava Dosa', category: 'South Indian', subcategory: 'Dosa', type: 'veg', gst: 5, keywords: ['dosa', 'rava'] },
  { name: 'Idli', category: 'South Indian', subcategory: 'Idli & Vada', type: 'veg', gst: 5, keywords: ['idli'] },
  { name: 'Medu Vada', category: 'South Indian', subcategory: 'Idli & Vada', type: 'veg', gst: 5, keywords: ['vada', 'medu'] },
  { name: 'Uttapam', category: 'South Indian', subcategory: 'Dosa', type: 'veg', gst: 5, keywords: ['uttapam'] },
  { name: 'Pongal', category: 'South Indian', subcategory: 'Rice', type: 'veg', gst: 5, keywords: ['pongal'] },

  // Chinese
  { name: 'Veg Fried Rice', category: 'Chinese', subcategory: 'Rice & Noodles', type: 'veg', gst: 5, keywords: ['fried', 'rice', 'veg'] },
  { name: 'Chicken Fried Rice', category: 'Chinese', subcategory: 'Rice & Noodles', type: 'non-veg', gst: 5, keywords: ['fried', 'rice', 'chicken'] },
  { name: 'Veg Noodles', category: 'Chinese', subcategory: 'Rice & Noodles', type: 'veg', gst: 5, keywords: ['noodles', 'veg', 'hakka'] },
  { name: 'Chicken Noodles', category: 'Chinese', subcategory: 'Rice & Noodles', type: 'non-veg', gst: 5, keywords: ['noodles', 'chicken', 'hakka'] },
  { name: 'Veg Manchurian', category: 'Chinese', subcategory: 'Gravy', type: 'veg', gst: 5, keywords: ['manchurian', 'veg'] },
  { name: 'Chicken Manchurian', category: 'Chinese', subcategory: 'Gravy', type: 'non-veg', gst: 5, keywords: ['manchurian', 'chicken'] },

  // Desserts
  { name: 'Gulab Jamun', category: 'Desserts', subcategory: 'Indian Sweets', type: 'veg', gst: 5, keywords: ['gulab', 'jamun'] },
  { name: 'Rasmalai', category: 'Desserts', subcategory: 'Indian Sweets', type: 'veg', gst: 5, keywords: ['rasmalai'] },
  { name: 'Kulfi', category: 'Desserts', subcategory: 'Ice Cream', type: 'veg', gst: 5, keywords: ['kulfi'] },
  { name: 'Ice Cream', category: 'Desserts', subcategory: 'Ice Cream', type: 'veg', gst: 5, keywords: ['ice', 'cream'] },
  { name: 'Double Ka Meetha', category: 'Desserts', subcategory: 'Indian Sweets', type: 'veg', gst: 5, keywords: ['double', 'ka', 'meetha'] },

  // Beverages
  { name: 'Sweet Lassi', category: 'Beverages', subcategory: 'Lassi & Shakes', type: 'veg', gst: 5, keywords: ['lassi', 'sweet'] },
  { name: 'Masala Chaas', category: 'Beverages', subcategory: 'Lassi & Shakes', type: 'veg', gst: 5, keywords: ['chaas', 'buttermilk', 'masala'] },
  { name: 'Mango Shake', category: 'Beverages', subcategory: 'Lassi & Shakes', type: 'veg', gst: 5, keywords: ['mango', 'shake'] },
  { name: 'Fresh Lime Soda', category: 'Beverages', subcategory: 'Soft Drinks', type: 'veg', gst: 5, keywords: ['lime', 'soda', 'nimbu'] },
  { name: 'Masala Chai', category: 'Beverages', subcategory: 'Tea & Coffee', type: 'veg', gst: 5, keywords: ['chai', 'tea', 'masala'] },
  { name: 'Filter Coffee', category: 'Beverages', subcategory: 'Tea & Coffee', type: 'veg', gst: 5, keywords: ['coffee', 'filter'] },
  { name: 'Cold Coffee', category: 'Beverages', subcategory: 'Tea & Coffee', type: 'veg', gst: 5, keywords: ['cold', 'coffee'] },
  { name: 'Iced Tea', category: 'Beverages', subcategory: 'Tea & Coffee', type: 'veg', gst: 5, keywords: ['iced', 'tea'] },
  { name: 'Soft Drink', category: 'Beverages', subcategory: 'Soft Drinks', type: 'veg', gst: 5, keywords: ['soft', 'drink', 'coke', 'pepsi', 'sprite'] },
  { name: 'Buttermilk', category: 'Beverages', subcategory: 'Lassi & Shakes', type: 'veg', gst: 5, keywords: ['buttermilk', 'majjige'] },

  // Breakfast
  { name: 'Poha', category: 'Breakfast', subcategory: 'North Indian Breakfast', type: 'veg', gst: 5, keywords: ['poha', 'pohe', 'flattened', 'rice'] },
  { name: 'Upma', category: 'Breakfast', subcategory: 'South Indian Breakfast', type: 'veg', gst: 5, keywords: ['upma', 'uppma', 'rava'] },
  { name: 'Aloo Paratha', category: 'Breakfast', subcategory: 'North Indian Breakfast', type: 'veg', gst: 5, keywords: ['aloo', 'paratha', 'potato'] },
  { name: 'Chole Bhature', category: 'Breakfast', subcategory: 'North Indian Breakfast', type: 'veg', gst: 5, keywords: ['chole', 'bhature', 'chana', 'bhatura'] },
  { name: 'Vada Pav', category: 'Breakfast', subcategory: 'Street Food', type: 'veg', gst: 5, keywords: ['vada', 'pav'] },
  { name: 'Misal Pav', category: 'Breakfast', subcategory: 'Street Food', type: 'veg', gst: 5, keywords: ['misal', 'pav'] },
  { name: 'Masala Omelette', category: 'Breakfast', subcategory: 'Egg Breakfast', type: 'egg', gst: 5, keywords: ['omelette', 'omelet', 'masala', 'egg'] },
  { name: 'Boiled Eggs', category: 'Breakfast', subcategory: 'Egg Breakfast', type: 'egg', gst: 5, keywords: ['boiled', 'egg', 'eggs'] },
  { name: 'Bread Butter Jam', category: 'Breakfast', subcategory: 'Continental Breakfast', type: 'veg', gst: 5, keywords: ['bread', 'butter', 'jam', 'toast'] },
  { name: 'Cornflakes with Milk', category: 'Breakfast', subcategory: 'Continental Breakfast', type: 'veg', gst: 5, keywords: ['cornflakes', 'cereal', 'milk'] },

  // Fast Food & Continental
  { name: 'Veg Burger', category: 'Fast Food', subcategory: 'Burgers', type: 'veg', gst: 5, keywords: ['veg', 'burger'] },
  { name: 'Chicken Burger', category: 'Fast Food', subcategory: 'Burgers', type: 'non-veg', gst: 5, keywords: ['chicken', 'burger'] },
  { name: 'Paneer Burger', category: 'Fast Food', subcategory: 'Burgers', type: 'veg', gst: 5, keywords: ['paneer', 'burger'] },
  { name: 'Veg Pizza', category: 'Fast Food', subcategory: 'Pizza', type: 'veg', gst: 5, keywords: ['veg', 'pizza', 'margherita'] },
  { name: 'Chicken Pizza', category: 'Fast Food', subcategory: 'Pizza', type: 'non-veg', gst: 5, keywords: ['chicken', 'pizza'] },
  { name: 'Cheese Pizza', category: 'Fast Food', subcategory: 'Pizza', type: 'veg', gst: 5, keywords: ['cheese', 'pizza'] },
  { name: 'Veg Sandwich', category: 'Fast Food', subcategory: 'Sandwiches', type: 'veg', gst: 5, keywords: ['veg', 'sandwich'] },
  { name: 'Grilled Chicken Sandwich', category: 'Fast Food', subcategory: 'Sandwiches', type: 'non-veg', gst: 5, keywords: ['grilled', 'chicken', 'sandwich'] },
  { name: 'Club Sandwich', category: 'Fast Food', subcategory: 'Sandwiches', type: 'veg', gst: 5, keywords: ['club', 'sandwich'] },
  { name: 'French Fries', category: 'Fast Food', subcategory: 'Sides', type: 'veg', gst: 5, keywords: ['french', 'fries', 'fry'] },
  { name: 'Pasta Alfredo', category: 'Fast Food', subcategory: 'Pasta', type: 'veg', gst: 5, keywords: ['pasta', 'alfredo', 'white', 'sauce'] },
  { name: 'Pasta Arrabbiata', category: 'Fast Food', subcategory: 'Pasta', type: 'veg', gst: 5, keywords: ['pasta', 'arrabbiata', 'red', 'sauce'] },
  { name: 'Veg Momos', category: 'Fast Food', subcategory: 'Momos', type: 'veg', gst: 5, keywords: ['momo', 'momos', 'veg', 'dumpling'] },
  { name: 'Chicken Momos', category: 'Fast Food', subcategory: 'Momos', type: 'non-veg', gst: 5, keywords: ['momo', 'momos', 'chicken', 'dumpling'] },
  { name: 'Chicken Shawarma Roll', category: 'Fast Food', subcategory: 'Rolls', type: 'non-veg', gst: 5, keywords: ['shawarma', 'chicken', 'roll'] },
  { name: 'Egg Roll', category: 'Fast Food', subcategory: 'Rolls', type: 'egg', gst: 5, keywords: ['egg', 'roll', 'kathi'] },
  { name: 'Veg Frankie', category: 'Fast Food', subcategory: 'Rolls', type: 'veg', gst: 5, keywords: ['veg', 'frankie', 'roll', 'kathi'] },
]

/** Category → default GST slab, used when a typed item has no catalog match. */
export const CATEGORY_DEFAULT_GST: Record<string, number> = {
  'Biryani & Rice': 5,
  Starters: 5,
  'Main Course': 5,
  Breads: 5,
  'South Indian': 5,
  Chinese: 5,
  Desserts: 5,
  Beverages: 5,
  Breakfast: 5,
  'Fast Food': 5,
}

export const CATEGORIES = Array.from(new Set(CATALOG.map((d) => d.category)))

export function subcategoriesFor(category: string): string[] {
  return Array.from(new Set(CATALOG.filter((d) => d.category === category).map((d) => d.subcategory)))
}
