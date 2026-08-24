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
| Mock dish catalog | `src/data/catalog.ts` | ~110 common Indian/fast-food restaurant dishes across 10 categories (incl. Breakfast, Fast Food), pre-tagged with category/subcategory/veg-non-veg/GST — stands in for the platform-owned taxonomy service. |
| Matching + inference engine | `src/lib/match.ts` | Stemmed keyword overlap + Levenshtein typo tolerance against the catalog; falls back to keyword-based category and veg/non-veg inference for dishes the catalog doesn't know; returns a confidence score. Full breakdown in `docs/ALGORITHM.md`. |
| Simplified single-item form | `src/components/AddMenuItem.tsx` | Name (with catalog autocomplete) + price required. Type/category/GST auto-fill as you type and stay editable. Category/subcategory are a creatable combobox — type "Breakfast" and it exists from then on. Availability (all-day or custom hours + days), an optional offer (flat/% off with live discounted-price preview), an active/disable toggle, and an optional photo upload live alongside it. |
| Bulk / paste import | `src/components/BulkAdd.tsx` | Paste a whole menu (`Name - Price` per line); every line is parsed and run through the same inference engine into an editable preview table before committing. |
| Running item list | `src/components/ItemList.tsx` | Shows what's been added, whether each item was auto-matched/auto-guessed/manual, and lets you toggle it active/inactive or add an offer after the fact. |

Try it: type "Chicken Biryani" — catalog match, everything fills in with a
green "matched" badge. Type "Chiken Biriyani" (misspelled) — still resolves
correctly via typo-tolerant matching. Type "Spicy Chicken Curry Bowl" — no
exact catalog entry, but it still infers Non-veg / Main Course from the
words "chicken" and "curry". Paste three menu lines into Bulk Add and watch
all three get classified before you commit.

## Running it

```bash
npm install
npm run dev
```

## Python backend

`backend/` is a from-scratch Python port of the detection engine (FastAPI),
extended with things a real backend needs that this client-only prototype
doesn't: duplicate-item detection, price sanity checks, a per-restaurant
feedback/learning loop, and real CSV/XLSX bulk import. See
[`backend/README.md`](backend/README.md) to run it, and
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for why it exists alongside
the TypeScript copy instead of replacing it (short version: this frontend
is published as a static Artifact preview and can't call an external
server — a real deployment should have it call this API instead of
carrying its own copy of the logic).

## Documentation

- [`docs/ALGORITHM.md`](docs/ALGORITHM.md) — the detection algorithm, step
  by step, with a worked example and the reasoning behind every threshold.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the frontend and
  backend fit together, a request-flow diagram, and what each feature does
  under the hood.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — prioritized next steps: embedding-
  based matching for synonyms/transliteration, OCR menu import, a real tax
  engine, multi-tenant catalogs, and more, each with a concrete approach.

## What's mocked vs. what's real work

This is still a prototype, not a production system:

- **Catalog service**: the ~110-dish list (both TS and Python copies) becomes
  a backend-owned Postgres table with trigram/pgvector search once it grows
  past a few thousand rows — see Roadmap item 1.
- **GST slabs**: currently a flat 5% default everywhere; real restaurant GST
  depends on registration type and item classification, not just category
  — see Roadmap item 8.
- **Feedback store is in-memory** (Python backend) — resets on restart, not
  shared across instances — see Roadmap item 2.
- **Confidence thresholds** (0.55 / 0.30) were hand-picked against worked
  examples, not tuned against real correction data — see Roadmap item 3.

## Suggested rollout order

1. **Progressive disclosure** on the existing form — collapse everything
   except name/price/veg-toggle behind "add more details," keep the current
   category dropdowns but default them from keywords in the name. Ships in
   days, no new backend.
2. **Catalog autocomplete** — stand up the shared dish taxonomy and wire
   autocomplete + auto-fill into the existing form. This is the highest-
   leverage change and the one that most changes the feel of the product.
3. **Bulk/paste import**, then spreadsheet upload, then OCR menu scan for
   new-restaurant onboarding (the Python backend already does the first two).
