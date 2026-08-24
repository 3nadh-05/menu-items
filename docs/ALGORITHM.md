# The detection algorithm, step by step

This is the "how did you do that auto-categorization" writeup. It describes
one algorithm implemented twice — `src/lib/match.ts` (frontend prototype)
and `backend/app/matching.py` (Python reference backend) — kept in lockstep
line for line. Everything below is true of both; where it matters, the
Python line numbers are cited since that's the version meant to actually
run in production.

## The problem

A merchant types a dish name. We need, before they've filled in anything
else: is this veg, non-veg, or egg? What menu category and subcategory
does it belong to? What GST slab applies? And how confident are we, so the
UI can decide between "just fill it in" and "fill it in but ask them to
confirm".

## Step 1 — Tokenize and stem

```python
def tokenize(text: str) -> list[str]:
    return [stem(t) for t in _TOKEN_RE.split(text.lower()) if t]
```

The name is lowercased and split on anything that isn't a letter or digit
("Chicken-Biryani, Family Pack!" → `chicken`, `biryani`, `family`, `pack`).
Each token is then run through a deliberately small stemmer:

```python
def stem(word):
    if word.endswith("ies") and len(word) > 4: return word[:-3] + "y"   # curries -> curry
    if word.endswith("es")  and len(word) > 4: return word[:-2]         # fries   -> fry
    if word.endswith("s")   and len(word) > 3 and not word.endswith("ss"): return word[:-1]  # idlis -> idli
    return word
```

This is not a real linguistic stemmer (no Porter/Snowball) — it exists to
fold the handful of plural forms a merchant actually types ("2 Idlis",
"French Fries") onto the singular forms the catalog stores. A real
stemmer would over-correct on short Indian dish names.

## Step 2 — Score every catalog dish, two ways

Every dish in the catalog (`backend/app/catalog.py`, ~110 entries) carries
its own name plus a hand-picked keyword list, e.g.:

```python
CatalogDish("Chicken Biryani", "Biryani & Rice", "Biryani", "non-veg", 5,
            keywords=("chicken", "biryani"))
```

For a typed name, each catalog dish gets scored two independent ways and
the **higher** of the two wins:

**(a) Keyword overlap.** How many of the dish's own tokens/keywords appear
in what was typed, weighted two ways at once — how much of *the dish* is
covered, and how much of *what the merchant typed* is covered:

```python
hits = len(all_keywords & set(tokens))
dish_coverage  = hits / len(all_keywords)      # did we recognize this dish?
query_coverage = hits / len(tokens)             # did the typed words mostly belong to it?
keyword_score  = dish_coverage * 0.6 + query_coverage * 0.4
```

Both terms matter: dish_coverage alone would let a two-word query full of
noise words weakly match a ten-keyword dish; query_coverage alone would
let a single shared word ("curry") between a five-word query and a
two-word dish name look like a strong match.

**(b) Whole-name similarity.** Independent of keywords, the raw typed
string is compared to the dish's full name via Levenshtein edit distance,
after both are squashed (lowercased, punctuation stripped):

```python
def name_similarity(query, dish_name):
    a, b = squash(query), squash(dish_name)
    if a == b: return 1.0
    if b.startswith(a) or a.startswith(b): return 0.9   # "chicken bir" vs "chickenbiryani"
    if b in a or a in b: return 0.8
    dist = levenshtein(a, b)
    return max(0, 1 - dist / max(len(a), len(b)))
```

This is what survives typos: "Chiken Biriyani" has zero exact keyword hits
against "chicken"/"biryani" as *tokens* would need, but its edit distance
to "chickenbiryani" is small, so `name_similarity` alone carries the match.

```python
score = max(keyword_score, name_similarity(query, dish.name) * 0.9)
```

(The 0.9 damping keeps a pure spelling coincidence from ever outscoring a
genuine keyword match.)

## Step 3 — Decide what the score means

The single best-scoring dish across the whole catalog is picked, then
bucketed:

| Score | Meaning | UI treatment |
|---|---|---|
| ≥ 0.55 | Confident catalog match | Auto-fill, green "matched" badge |
| 0.30 – 0.55 | Plausible catalog match | Auto-fill, amber "please confirm" badge |
| < 0.30 | Not close enough to trust | Fall through to Step 4 |

These thresholds were picked by hand against the worked examples in
`backend/tests/test_matching.py`, not derived statistically — see
`docs/ROADMAP.md` for how a real deployment should tune them from actual
merchant-correction data instead.

## Step 4 — Keyword → category fallback

If no catalog dish scored high enough, a second, much smaller table is
checked — not per-dish, but per-**category**:

```python
CATEGORY_KEYWORDS = [
    ("Breakfast",      "North Indian Breakfast", {"poha", "upma", "paratha", ...}),
    ("Biryani & Rice",  "Biryani",                {"biryani", "biriyani", "pulao", "pilaf"}),
    ("South Indian",    "Dosa",                    {"dosa", "idli", "vada", "uttapam", ...}),
    ...
]
```

This exists because the catalog can't enumerate every dish a restaurant
serves, but a handful of category-defining words ("biryani", "dosa",
"noodles"...) reliably signal *which shelf* an unknown dish belongs on
even when the specific dish is new. First matching entry wins — the list
is ordered from most to least specific on purpose (Breakfast before Main
Course, so "Chicken Curry Breakfast Combo" doesn't get stolen by the
generic "curry" trigger).

## Step 5 — Veg / non-veg / egg, independent of category

Regardless of whether a category was found, type is inferred from a fixed
word list checked against the tokens:

```python
NON_VEG_WORDS = {"chicken", "mutton", "fish", "prawn", "shrimp", "beef", "pork", ...}
EGG_WORDS = {"egg", "omelette", "omelet"}
```

Non-veg wins over egg if both appear (a chicken-and-egg dish is non-veg on
every Indian platform's convention); anything matching neither defaults to
**veg** — the safer default, since a veg item mislabeled non-veg is a
worse trust violation than the reverse.

## Step 6 — Safe manual default

If nothing above produced anything: `Main Course / Veg / 5% GST`,
confidence `0`, source `"manual"`. The merchant fills in the rest by hand
— this is the only case where the form doesn't try to help at all.

## Worked example

Input: `"Chiken Biriyani"` (misspelled)

1. Tokenize → `["chiken", "biriyani"]` (stemmer doesn't touch either word)
2. Keyword overlap against "Chicken Biryani" (keywords `chicken`,
   `biryani`): **zero** hits — `chiken` ≠ `chicken`, `biriyani` ≠
   `biryani` as tokens. `keyword_score = 0`.
3. `name_similarity("Chiken Biriyani", "Chicken Biryani")`: squashed to
   `chikenbiriyani` vs `chickenbiryani` — edit distance 2 over length 14 →
   similarity ≈ 0.857. Score = `0.857 * 0.9` ≈ **0.77**.
2. 0.77 ≥ 0.55 → confident catalog match: `non-veg`, `Biryani & Rice`,
   `Biryani`, `5% GST`, source `catalog`, confidence `0.77`.

This is exactly the case the pure-keyword version of this engine (the
first draft, before Levenshtein was added) got wrong — see
`backend/tests/test_matching.py::test_typo_still_resolves_to_the_right_dish`.

## Bulk import reuses the exact same function per line

`backend/app/bulk_import.py` splits a pasted line into `(name, price)` via
one regex (`^(.+?)[\s,\t\-–—]+₹?\s*(\d+(?:\.\d{1,2})?)\s*$`, matching
"Name - 249", "Name, 249" and "Name 249"), then calls `suggest_for(name)`
— there is no separate "bulk" detection algorithm. What bulk mode adds on
top, per row, is duplicate detection against the rest of the batch and the
existing menu (`app/duplicates.py`, itself just `name_similarity` against
a stricter 0.82 threshold) and a price sanity check (`app/pricing.py`).
