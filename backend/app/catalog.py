"""Master dish catalog — Python port of ``src/data/catalog.ts``.

Stands in for the shared taxonomy Swiggy/Zomato maintain centrally
(thousands of known dishes, pre-tagged with category, type and tax slab)
so a merchant rarely types a dish the platform hasn't already seen. In a
real deployment this table lives in Postgres (or an Elasticsearch/pgvector
index once the catalog grows past a few thousand rows) — it is a plain
Python list here purely so the matching logic in ``matching.py`` has no
infrastructure dependency and can be unit tested in isolation.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CatalogDish:
    name: str
    category: str
    subcategory: str
    type: str  # "veg" | "non-veg" | "egg"
    gst: float
    keywords: tuple[str, ...] = field(default_factory=tuple)


def _d(name: str, category: str, subcategory: str, type_: str, gst: float, keywords: list[str]) -> CatalogDish:
    return CatalogDish(name, category, subcategory, type_, gst, tuple(keywords))


CATALOG: list[CatalogDish] = [
    # Biryani & Rice
    _d("Chicken Biryani", "Biryani & Rice", "Biryani", "non-veg", 5, ["chicken", "biryani"]),
    _d("Mutton Biryani", "Biryani & Rice", "Biryani", "non-veg", 5, ["mutton", "biryani"]),
    _d("Egg Biryani", "Biryani & Rice", "Biryani", "egg", 5, ["egg", "biryani"]),
    _d("Veg Biryani", "Biryani & Rice", "Biryani", "veg", 5, ["veg", "biryani", "vegetable"]),
    _d("Paneer Biryani", "Biryani & Rice", "Biryani", "veg", 5, ["paneer", "biryani"]),
    _d("Fish Biryani", "Biryani & Rice", "Biryani", "non-veg", 5, ["fish", "biryani"]),
    _d("Prawn Biryani", "Biryani & Rice", "Biryani", "non-veg", 5, ["prawn", "shrimp", "biryani"]),
    _d("Jeera Rice", "Biryani & Rice", "Rice", "veg", 5, ["jeera", "rice", "cumin"]),
    _d("Curd Rice", "Biryani & Rice", "Rice", "veg", 5, ["curd", "rice", "yogurt"]),
    _d("Ghee Rice", "Biryani & Rice", "Rice", "veg", 5, ["ghee", "rice"]),
    # Starters
    _d("Chicken 65", "Starters", "Non-Veg Starters", "non-veg", 5, ["chicken", "65"]),
    _d("Chilli Chicken", "Starters", "Non-Veg Starters", "non-veg", 5, ["chilli", "chicken"]),
    _d("Chicken Lollipop", "Starters", "Non-Veg Starters", "non-veg", 5, ["chicken", "lollipop"]),
    _d("Tandoori Chicken", "Starters", "Non-Veg Starters", "non-veg", 5, ["tandoori", "chicken"]),
    _d("Chicken Tikka", "Starters", "Non-Veg Starters", "non-veg", 5, ["chicken", "tikka"]),
    _d("Seekh Kebab", "Starters", "Non-Veg Starters", "non-veg", 5, ["seekh", "kebab", "kabab"]),
    _d("Fish Fry", "Starters", "Non-Veg Starters", "non-veg", 5, ["fish", "fry"]),
    _d("Prawn Fry", "Starters", "Non-Veg Starters", "non-veg", 5, ["prawn", "fry", "shrimp"]),
    _d("Paneer Tikka", "Starters", "Veg Starters", "veg", 5, ["paneer", "tikka"]),
    _d("Gobi Manchurian", "Starters", "Veg Starters", "veg", 5, ["gobi", "manchurian", "cauliflower"]),
    _d("Veg Spring Roll", "Starters", "Veg Starters", "veg", 5, ["spring", "roll", "veg"]),
    _d("Mushroom 65", "Starters", "Veg Starters", "veg", 5, ["mushroom", "65"]),
    _d("Corn Chaat", "Starters", "Veg Starters", "veg", 5, ["corn", "chaat"]),
    _d("Papad", "Starters", "Veg Starters", "veg", 5, ["papad", "papadum"]),
    # Main Course
    _d("Butter Chicken", "Main Course", "Non-Veg Curries", "non-veg", 5, ["butter", "chicken", "makhani"]),
    _d("Chicken Curry", "Main Course", "Non-Veg Curries", "non-veg", 5, ["chicken", "curry"]),
    _d("Mutton Curry", "Main Course", "Non-Veg Curries", "non-veg", 5, ["mutton", "curry"]),
    _d("Chicken Chettinad", "Main Course", "Non-Veg Curries", "non-veg", 5, ["chicken", "chettinad"]),
    _d("Fish Curry", "Main Course", "Non-Veg Curries", "non-veg", 5, ["fish", "curry"]),
    _d("Egg Curry", "Main Course", "Non-Veg Curries", "egg", 5, ["egg", "curry"]),
    _d("Paneer Butter Masala", "Main Course", "Veg Curries", "veg", 5, ["paneer", "butter", "masala"]),
    _d("Paneer Tikka Masala", "Main Course", "Veg Curries", "veg", 5, ["paneer", "tikka", "masala"]),
    _d("Dal Tadka", "Main Course", "Veg Curries", "veg", 5, ["dal", "tadka", "lentil"]),
    _d("Dal Makhani", "Main Course", "Veg Curries", "veg", 5, ["dal", "makhani", "lentil"]),
    _d("Chana Masala", "Main Course", "Veg Curries", "veg", 5, ["chana", "chole", "masala", "chickpea"]),
    _d("Palak Paneer", "Main Course", "Veg Curries", "veg", 5, ["palak", "paneer", "spinach"]),
    _d("Mixed Veg Curry", "Main Course", "Veg Curries", "veg", 5, ["mixed", "veg", "curry", "vegetable"]),
    _d("Malai Kofta", "Main Course", "Veg Curries", "veg", 5, ["malai", "kofta"]),
    # Breads
    _d("Butter Naan", "Breads", "Naan", "veg", 5, ["naan", "butter"]),
    _d("Garlic Naan", "Breads", "Naan", "veg", 5, ["naan", "garlic"]),
    _d("Tandoori Roti", "Breads", "Roti", "veg", 5, ["roti", "tandoori"]),
    _d("Lachha Paratha", "Breads", "Paratha", "veg", 5, ["paratha", "lachha"]),
    _d("Plain Paratha", "Breads", "Paratha", "veg", 5, ["paratha", "plain"]),
    # South Indian
    _d("Masala Dosa", "South Indian", "Dosa", "veg", 5, ["dosa", "masala"]),
    _d("Plain Dosa", "South Indian", "Dosa", "veg", 5, ["dosa", "plain"]),
    _d("Rava Dosa", "South Indian", "Dosa", "veg", 5, ["dosa", "rava"]),
    _d("Idli", "South Indian", "Idli & Vada", "veg", 5, ["idli"]),
    _d("Medu Vada", "South Indian", "Idli & Vada", "veg", 5, ["vada", "medu"]),
    _d("Uttapam", "South Indian", "Dosa", "veg", 5, ["uttapam"]),
    _d("Pongal", "South Indian", "Rice", "veg", 5, ["pongal"]),
    # Chinese
    _d("Veg Fried Rice", "Chinese", "Rice & Noodles", "veg", 5, ["fried", "rice", "veg"]),
    _d("Chicken Fried Rice", "Chinese", "Rice & Noodles", "non-veg", 5, ["fried", "rice", "chicken"]),
    _d("Veg Noodles", "Chinese", "Rice & Noodles", "veg", 5, ["noodles", "veg", "hakka"]),
    _d("Chicken Noodles", "Chinese", "Rice & Noodles", "non-veg", 5, ["noodles", "chicken", "hakka"]),
    _d("Veg Manchurian", "Chinese", "Gravy", "veg", 5, ["manchurian", "veg"]),
    _d("Chicken Manchurian", "Chinese", "Gravy", "non-veg", 5, ["manchurian", "chicken"]),
    # Desserts
    _d("Gulab Jamun", "Desserts", "Indian Sweets", "veg", 5, ["gulab", "jamun"]),
    _d("Rasmalai", "Desserts", "Indian Sweets", "veg", 5, ["rasmalai"]),
    _d("Kulfi", "Desserts", "Ice Cream", "veg", 5, ["kulfi"]),
    _d("Ice Cream", "Desserts", "Ice Cream", "veg", 5, ["ice", "cream"]),
    _d("Double Ka Meetha", "Desserts", "Indian Sweets", "veg", 5, ["double", "ka", "meetha"]),
    # Beverages
    _d("Sweet Lassi", "Beverages", "Lassi & Shakes", "veg", 5, ["lassi", "sweet"]),
    _d("Masala Chaas", "Beverages", "Lassi & Shakes", "veg", 5, ["chaas", "buttermilk", "masala"]),
    _d("Mango Shake", "Beverages", "Lassi & Shakes", "veg", 5, ["mango", "shake"]),
    _d("Fresh Lime Soda", "Beverages", "Soft Drinks", "veg", 5, ["lime", "soda", "nimbu"]),
    _d("Masala Chai", "Beverages", "Tea & Coffee", "veg", 5, ["chai", "tea", "masala"]),
    _d("Filter Coffee", "Beverages", "Tea & Coffee", "veg", 5, ["coffee", "filter"]),
    _d("Cold Coffee", "Beverages", "Tea & Coffee", "veg", 5, ["cold", "coffee"]),
    _d("Iced Tea", "Beverages", "Tea & Coffee", "veg", 5, ["iced", "tea"]),
    _d("Soft Drink", "Beverages", "Soft Drinks", "veg", 5, ["soft", "drink", "coke", "pepsi", "sprite"]),
    _d("Buttermilk", "Beverages", "Lassi & Shakes", "veg", 5, ["buttermilk", "majjige"]),
    # Breakfast
    _d("Poha", "Breakfast", "North Indian Breakfast", "veg", 5, ["poha", "pohe", "flattened", "rice"]),
    _d("Upma", "Breakfast", "South Indian Breakfast", "veg", 5, ["upma", "uppma", "rava"]),
    _d("Aloo Paratha", "Breakfast", "North Indian Breakfast", "veg", 5, ["aloo", "paratha", "potato"]),
    _d("Chole Bhature", "Breakfast", "North Indian Breakfast", "veg", 5, ["chole", "bhature", "chana", "bhatura"]),
    _d("Vada Pav", "Breakfast", "Street Food", "veg", 5, ["vada", "pav"]),
    _d("Misal Pav", "Breakfast", "Street Food", "veg", 5, ["misal", "pav"]),
    _d("Masala Omelette", "Breakfast", "Egg Breakfast", "egg", 5, ["omelette", "omelet", "masala", "egg"]),
    _d("Boiled Eggs", "Breakfast", "Egg Breakfast", "egg", 5, ["boiled", "egg", "eggs"]),
    _d("Bread Butter Jam", "Breakfast", "Continental Breakfast", "veg", 5, ["bread", "butter", "jam", "toast"]),
    _d("Cornflakes with Milk", "Breakfast", "Continental Breakfast", "veg", 5, ["cornflakes", "cereal", "milk"]),
    # Fast Food & Continental
    _d("Veg Burger", "Fast Food", "Burgers", "veg", 5, ["veg", "burger"]),
    _d("Chicken Burger", "Fast Food", "Burgers", "non-veg", 5, ["chicken", "burger"]),
    _d("Paneer Burger", "Fast Food", "Burgers", "veg", 5, ["paneer", "burger"]),
    _d("Veg Pizza", "Fast Food", "Pizza", "veg", 5, ["veg", "pizza", "margherita"]),
    _d("Chicken Pizza", "Fast Food", "Pizza", "non-veg", 5, ["chicken", "pizza"]),
    _d("Cheese Pizza", "Fast Food", "Pizza", "veg", 5, ["cheese", "pizza"]),
    _d("Veg Sandwich", "Fast Food", "Sandwiches", "veg", 5, ["veg", "sandwich"]),
    _d("Grilled Chicken Sandwich", "Fast Food", "Sandwiches", "non-veg", 5, ["grilled", "chicken", "sandwich"]),
    _d("Club Sandwich", "Fast Food", "Sandwiches", "veg", 5, ["club", "sandwich"]),
    _d("French Fries", "Fast Food", "Sides", "veg", 5, ["french", "fries", "fry"]),
    _d("Pasta Alfredo", "Fast Food", "Pasta", "veg", 5, ["pasta", "alfredo", "white", "sauce"]),
    _d("Pasta Arrabbiata", "Fast Food", "Pasta", "veg", 5, ["pasta", "arrabbiata", "red", "sauce"]),
    _d("Veg Momos", "Fast Food", "Momos", "veg", 5, ["momo", "momos", "veg", "dumpling"]),
    _d("Chicken Momos", "Fast Food", "Momos", "non-veg", 5, ["momo", "momos", "chicken", "dumpling"]),
    _d("Chicken Shawarma Roll", "Fast Food", "Rolls", "non-veg", 5, ["shawarma", "chicken", "roll"]),
    _d("Egg Roll", "Fast Food", "Rolls", "egg", 5, ["egg", "roll", "kathi"]),
    _d("Veg Frankie", "Fast Food", "Rolls", "veg", 5, ["veg", "frankie", "roll", "kathi"]),
]

# Category -> default GST slab, used when a typed item has no catalog match.
CATEGORY_DEFAULT_GST: dict[str, float] = {
    "Biryani & Rice": 5,
    "Starters": 5,
    "Main Course": 5,
    "Breads": 5,
    "South Indian": 5,
    "Chinese": 5,
    "Desserts": 5,
    "Beverages": 5,
    "Breakfast": 5,
    "Fast Food": 5,
}

CATEGORIES: list[str] = list(dict.fromkeys(d.category for d in CATALOG))


def subcategories_for(category: str) -> list[str]:
    return list(dict.fromkeys(d.subcategory for d in CATALOG if d.category == category))
