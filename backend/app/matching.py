"""Name -> (type, category, subcategory, GST) detection engine.

Python port of ``src/lib/match.ts``, extended with an in-memory cache and a
pluggable ``MatchProvider`` interface so a future embedding-based matcher
(see ``docs/ROADMAP.md``) can be swapped in without touching call sites.

Algorithm, in order of precedence:

1. **Exact / fuzzy catalog match.** Tokenize the typed name, stem each
   token (crude plural/tense folding: "idlis" -> "idli"), and score every
   catalog dish two ways — keyword overlap, and Levenshtein similarity
   against the dish's full name (typo tolerance). The higher of the two
   wins. A score >= 0.55 is treated as confident; 0.30-0.55 is offered as
   a "please confirm" guess; below 0.30 the catalog is abandoned.
2. **Keyword -> category fallback.** If no catalog dish scores high enough,
   a small keyword -> category lookup table still lets us guess a
   category ("biryani" -> Biryani & Rice) even for a dish we don't know.
3. **Veg/non-veg from the name alone.** Independent of category, a fixed
   word list (chicken, mutton, fish, ...) flags non-veg/egg; anything not
   flagged defaults to veg.
4. **Safe manual default.** Main Course / Veg / 5% GST, confidence 0 —
   the merchant fills in the rest by hand.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional, Protocol

from .catalog import CATALOG, CATEGORY_DEFAULT_GST, CatalogDish

_TOKEN_RE = re.compile(r"[^a-z0-9]+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]")

MANUAL_FALLBACK_CATEGORY = "Main Course"
MANUAL_FALLBACK_SUBCATEGORY = "Veg Curries"

NON_VEG_WORDS = {
    "chicken", "mutton", "fish", "prawn", "shrimp", "beef", "pork", "meat",
    "keema", "kheema", "crab", "lamb", "goat", "seafood", "squid", "liver",
}
EGG_WORDS = {"egg", "omelette", "omelet"}

# category -> (subcategory, trigger words). Order matters: first match wins,
# same as the TS version, so more specific categories are listed first.
CATEGORY_KEYWORDS: list[tuple[str, str, set[str]]] = [
    ("Breakfast", "North Indian Breakfast", {"poha", "upma", "paratha", "bhature", "bhatura", "breakfast"}),
    ("Biryani & Rice", "Biryani", {"biryani", "biriyani", "pulao", "pilaf"}),
    ("South Indian", "Dosa", {"dosa", "idli", "vada", "uttapam", "pongal", "sambar"}),
    ("Breads", "Roti", {"naan", "roti", "kulcha", "phulka"}),
    ("Chinese", "Rice & Noodles", {"noodle", "manchurian", "chowmein", "hakka", "schezwan", "szechwan"}),
    ("Fast Food", "Burgers", {"burger", "pizza", "sandwich", "pasta", "momo", "shawarma", "frankie", "fries", "wrap"}),
    ("Desserts", "Indian Sweets", {"jamun", "rasmalai", "kulfi", "halwa", "kheer", "barfi", "cake", "brownie", "mousse", "pudding"}),
    ("Beverages", "Tea & Coffee", {"juice", "shake", "lassi", "chai", "coffee", "soda", "mocktail", "smoothie", "tea", "drink"}),
    ("Starters", "Non-Veg Starters", {"tikka", "kebab", "kabab", "lollipop", "65", "fry", "roll", "pakora", "cutlet", "starter"}),
    ("Main Course", "Veg Curries", {"curry", "masala", "gravy", "kurma", "korma", "sabzi", "dal", "kofta"}),
]


def stem(word: str) -> str:
    """Crude English stemmer: enough to fold "idlis"->"idli", "fries"->"fry"."""
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 4 and word.endswith("es"):
        return word[:-2]
    if len(word) > 3 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]
    return word


def tokenize(text: str) -> list[str]:
    return [stem(t) for t in _TOKEN_RE.split(text.lower()) if t]


def squash(text: str) -> str:
    return _NON_ALNUM_RE.sub("", text.lower())


def levenshtein(a: str, b: str) -> int:
    """Classic edit distance, used to tolerate typos in a typed dish name."""
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        curr = [i] + [0] * len(b)
        for j, cb in enumerate(b, start=1):
            cost = 0 if ca == cb else 1
            curr[j] = min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
        prev = curr
    return prev[-1]


def name_similarity(query: str, dish_name: str) -> float:
    a, b = squash(query), squash(dish_name)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if b.startswith(a) or a.startswith(b):
        return 0.9
    if b in a or a in b:
        return 0.8
    dist = levenshtein(a, b)
    return max(0.0, 1 - dist / max(len(a), len(b)))


def infer_type(tokens: list[str]) -> str:
    if any(t in NON_VEG_WORDS or stem(t) in NON_VEG_WORDS for t in tokens):
        return "non-veg"
    if any(t in EGG_WORDS for t in tokens):
        return "egg"
    return "veg"


def infer_category(tokens: list[str]) -> Optional[tuple[str, str]]:
    token_set = set(tokens)
    for category, subcategory, words in CATEGORY_KEYWORDS:
        if token_set & words or {stem(w) for w in words} & token_set:
            return category, subcategory
    return None


def _score_dish(tokens: list[str], query: str, dish: CatalogDish) -> float:
    dish_tokens = tokenize(dish.name)
    all_keywords = set(dish_tokens) | {stem(k) for k in dish.keywords}
    hits = len(all_keywords & set(tokens))
    dish_coverage = hits / len(all_keywords) if all_keywords else 0
    query_coverage = hits / max(1, len(tokens))
    keyword_score = (dish_coverage * 0.6 + query_coverage * 0.4) if hits else 0.0

    # Typo/partial tolerance: compare the raw typed name to the dish name
    # directly, so "chiken biriyani" or "biryani" alone still lands right.
    name_score = name_similarity(query, dish.name)
    return max(keyword_score, name_score * 0.9)


@dataclass(frozen=True)
class Suggestion:
    type: str
    category: str
    subcategory: str
    gst: float
    source: str  # "catalog" | "inferred" | "manual" | "learned"
    confidence: float
    matched_dish: Optional[str] = None


def _manual_fallback(type_: str = "veg", source: str = "manual", confidence: float = 0.0) -> Suggestion:
    return Suggestion(type_, MANUAL_FALLBACK_CATEGORY, MANUAL_FALLBACK_SUBCATEGORY, 5, source, confidence)


class MatchProvider(Protocol):
    """Pluggable detection backend — see docs/ROADMAP.md for an embedding-based Phase 2 implementation."""

    def suggest(self, name: str) -> Suggestion: ...

    def autocomplete(self, query: str, limit: int = 6) -> list[CatalogDish]: ...


class RuleBasedMatcher:
    """Keyword + Levenshtein matcher against the bundled catalog. The default, dependency-free provider."""

    def suggest(self, name: str) -> Suggestion:
        return _suggest_cached(name.strip())

    def autocomplete(self, query: str, limit: int = 6) -> list[CatalogDish]:
        return list(_autocomplete_cached(query.strip().lower(), limit))


@lru_cache(maxsize=4096)
def _suggest_cached(trimmed: str) -> Suggestion:
    if not trimmed:
        return _manual_fallback()

    tokens = tokenize(trimmed)

    best: Optional[tuple[CatalogDish, float]] = None
    for dish in CATALOG:
        score = _score_dish(tokens, trimmed, dish)
        if score > 0 and (best is None or score > best[1]):
            best = (dish, score)

    if best and best[1] >= 0.55:
        dish, score = best
        return Suggestion(dish.type, dish.category, dish.subcategory, dish.gst, "catalog", min(0.97, score), dish.name)
    if best and best[1] >= 0.30:
        dish, score = best
        return Suggestion(dish.type, dish.category, dish.subcategory, dish.gst, "catalog", score, dish.name)

    category_guess = infer_category(tokens)
    food_type = infer_type(tokens)
    if category_guess:
        category, subcategory = category_guess
        return Suggestion(food_type, category, subcategory, CATEGORY_DEFAULT_GST.get(category, 5), "inferred", 0.55)

    if food_type != "veg":
        return _manual_fallback(food_type, "inferred", 0.3)

    return _manual_fallback()


@lru_cache(maxsize=2048)
def _autocomplete_cached(trimmed: str, limit: int) -> tuple[CatalogDish, ...]:
    if len(trimmed) < 2:
        return ()
    starts = [d for d in CATALOG if d.name.lower().startswith(trimmed)]
    contains = [d for d in CATALOG if d not in starts and trimmed in d.name.lower()]
    if len(starts) + len(contains) >= limit:
        return tuple((starts + contains)[:limit])

    # Nothing textually contains the query (likely a typo) — fuzzy fallback.
    ranked = sorted(
        (d for d in CATALOG if name_similarity(trimmed, d.name) >= 0.55),
        key=lambda d: name_similarity(trimmed, d.name),
        reverse=True,
    )
    seen = {d.name for d in starts + contains}
    return tuple((starts + contains + [d for d in ranked if d.name not in seen])[:limit])


# Module-level default instance — swap for an EmbeddingMatcher (docs/ROADMAP.md) without touching call sites.
default_matcher: MatchProvider = RuleBasedMatcher()


def suggest_for(name: str) -> Suggestion:
    return default_matcher.suggest(name)


def autocomplete(query: str, limit: int = 6) -> list[CatalogDish]:
    return default_matcher.autocomplete(query, limit)
