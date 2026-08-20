# Menu Item Creation — simplified

A prototype rebuilding the "Add Menu Item" flow around the pattern Swiggy/Zomato
use for merchant onboarding: **name + price is the whole required form.**
Category, veg/non-veg and GST are auto-detected, editable, never blocking.

## Why the original form is slow

The current flow (see the reference screenshot) makes every merchant pick
Item Type, Category, Subcategory, and fill a variant table before they can
save — for every single dish, every time. Restaurants overwhelmingly serve
dishes the platform has seen thousands of times before (Chicken Biryani,
Paneer Tikka, Masala Dosa...), so asking a human to manually classify each
one is redundant data entry, not real decision-making.

## How Swiggy/Zomato actually do it

They don't ask the merchant to classify anything from scratch:

1. **Shared dish catalog.** A central taxonomy of known dishes — name,
   category, subcategory, veg/non-veg, default tax slab, even a stock image —
   maintained once, reused by every merchant. Typing "Chicken Bir…" matches
   it instantly.
2. **Three required fields to publish**: name, price, veg/non-veg. Everything
   else is a smart default the merchant can edit later, not a gate.
3. **Inference as a fallback**, not the primary mechanism. A dish that isn't
   in the catalog still gets a category guess and a veg/non-veg guess from
   keywords in the name ("Chicken …" → non-veg, "… Curry" → Main Course).
4. **Bulk-first onboarding.** New restaurants rarely add one item at a time —
   they paste a menu, upload a spreadsheet, or platform staff OCR-scan a
   printed menu. One-at-a-time forms are the exception, not the workflow.
5. **Variants are opt-in.** Most items have one price. A size/portion table
   is only shown once the merchant asks for it.

## What this prototype implements

| Piece | File | What it does |
|---|---|---|
| Mock dish catalog | `src/data/catalog.ts` | ~70 common Indian restaurant dishes, pre-tagged with category/subcategory/veg-non-veg/GST — stands in for the platform-owned taxonomy service. |
| Matching + inference engine | `src/lib/match.ts` | Exact + fuzzy match against the catalog; falls back to keyword-based category and veg/non-veg inference for dishes the catalog doesn't know; returns a confidence score. |
| Simplified single-item form | `src/components/AddMenuItem.tsx` | Name (with catalog autocomplete) + price required. Type/category/GST auto-fill as you type and stay editable. Description, subcategory, and multiple sizes live behind a single "+ Add more details" toggle, off by default. |
| Bulk / paste import | `src/components/BulkAdd.tsx` | Paste a whole menu (`Name - Price` per line); every line is parsed and run through the same inference engine into an editable preview table before committing. |
| Running item list | `src/components/ItemList.tsx` | Shows what's been added and whether each item was auto-matched, auto-guessed, or entered manually — makes the automation's hit rate visible. |

Try it: type "Chicken Biryani" — catalog match, everything fills in with a
green "matched" badge. Type "Spicy Chicken Curry Bowl" — no exact catalog
entry, but it still infers Non-veg / Main Course from the words "chicken"
and "curry", with an amber "please confirm" badge. Paste three menu lines
into Bulk Add and watch all three get classified before you commit.

## Running it

```bash
npm install
npm run dev
```

## What's mocked vs. what's real work

This is a UX/interaction prototype, not a production system. To ship the
real version:

- **Catalog service**: the 70-dish array becomes a backend-owned, searchable
  table (thousands of dishes, per-cuisine, kept current by a content team or
  ingested from partner restaurants' existing menus). Search moves from
  in-memory scoring to Elasticsearch/pgvector for typo tolerance and scale.
- **GST slabs**: currently a flat 5% default: real restaurant GST varies by
  registration type (composition scheme vs. regular, AC vs. non-AC
  historically, alcohol vs. food) and should come from the business's tax
  profile, not a per-category guess.
- **Bulk import**: paste-a-list is the cheap first step. The bigger lever is
  OCR/photo-menu import and spreadsheet upload, which is what Swiggy/Zomato
  onboarding teams use for new restaurants today.
- **Confidence threshold tuning**: what counts as "confident enough to
  auto-fill silently" vs. "auto-fill but flag for confirmation" should be
  tuned against real merchant data, not guessed.

## Suggested rollout order

1. **Progressive disclosure** on the existing form — collapse everything
   except name/price/veg-toggle behind "add more details," keep the current
   category dropdowns but default them from keywords in the name. Ships in
   days, no new backend.
2. **Catalog autocomplete** — stand up the shared dish taxonomy and wire
   autocomplete + auto-fill into the existing form. This is the highest-
   leverage change and the one that most changes the feel of the product.
3. **Bulk/paste import**, then OCR menu scan for new-restaurant onboarding.
