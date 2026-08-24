# Roadmap — what a production version needs next

Ordered by leverage: each tier assumes the tier above it is done. Every
item names a concrete approach, not just a wish — this is meant to be
handed to whoever picks up the next slice of work, not re-derived.

## Now — closes real gaps in what's built

**1. Move the catalog into Postgres with trigram search.**
At ~110 rows, a Python list is the right call. A real deployment's
catalog is thousands of dishes across regional cuisines, and linear
Python-side scoring stops being cheap. Move `CATALOG` into a
`catalog_dishes` table, add a `pg_trgm` GIN index on `name`, and let
Postgres's `similarity()` do the first-pass narrowing (top ~50 candidates)
before the existing Levenshtein/keyword scoring ranks them — same
algorithm, just not scanning every row in Python for every keystroke.

**2. Durable feedback store.**
`backend/app/feedback.py` is in-process memory today — gone on restart,
not shared across instances. Move to a `restaurant_corrections(restaurant_id,
dish_name_normalized, corrected_json, correction_count, updated_at)`
table. `FeedbackStore.lookup`/`record_correction` are already the only two
methods anything calls — swapping the backing store behind them is a
contained change.

**3. Threshold tuning from real data, not hand-tuning.**
The 0.55 / 0.30 confidence cutoffs in `matching.py` were picked against a
handful of worked examples. Once `/feedback` has real volume: for every
suggestion a merchant *didn't* correct, that's a true positive at its
confidence score; for every one they *did* correct, a false positive.
Plot precision against confidence and pick thresholds off that curve
instead of intuition — a day of analysis once there's a few weeks of
`/feedback` data.

**4. Availability engine.**
The `Availability` model (`allDay`, `startTime`, `endTime`, `days`) exists
in the frontend but nothing evaluates "is this item orderable *right
now*". That's a small, sharp piece of logic (timezone-aware, per-outlet,
ideally testable independent of wall-clock time via dependency injection)
that belongs in the backend before this is real — every customer-facing
menu read needs it.

## Next — meaningfully extends what's here

**5. Embedding-based matching as a second `MatchProvider`.**
The `MatchProvider` protocol in `matching.py` exists specifically so this
slots in without touching `/suggest` or `/bulk/*`:

```python
class EmbeddingMatcher:
    def __init__(self, model_name="paraphrase-multilingual-MiniLM-L12-v2"):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)
        self.dish_embeddings = self.model.encode([d.name for d in CATALOG])

    def suggest(self, name: str) -> Suggestion:
        query_vec = self.model.encode([name])
        # cosine similarity against self.dish_embeddings (or a FAISS/pgvector
        # index once the catalog is large), same confidence-bucket logic as
        # RuleBasedMatcher from there.
        ...
```

Why this matters over the current rule-based matcher: it catches
*synonyms*, not just typos — "chow mein" ↔ "noodles", "curd rice" ↔
"yogurt rice", dish names in transliterated Hindi/Tamil/Telugu typed by a
merchant who thinks in that language but types in Latin script. The
current matcher cannot do this by construction (it only ever compares
against literal keyword lists and edit distance); an embedding model
handles it because it's trained on meaning, not spelling. Recommended
starting point: a multilingual sentence-transformer (handles the
transliteration case for free) plus FAISS for in-memory ANN search, or
pgvector if the catalog is already in Postgres from item 1.

**6. OCR photo-menu import.**
The single highest-leverage onboarding feature this whole prototype
doesn't have: a merchant photographs their printed menu, the backend
extracts line items, and every line runs through the exact same
`build_bulk_rows()` pipeline that `/bulk/text` and `/bulk/file` already
use. Concretely: Google Cloud Vision or AWS Textract for OCR (both handle
multi-column printed menus reasonably; Tesseract is the free but
noticeably worse fallback), a light post-processing pass to split
OCR'd lines into name/price the same way `bulk_import.parse_line()`
already does, then straight into `build_bulk_rows()`. No new detection
logic needed — this is entirely a new *input* into the pipeline that
exists.

**7. Multi-tenant catalog: chain vs. outlet.**
A restaurant chain's 40 outlets shouldn't each independently build up
their own custom-category list from scratch (today's `customCategories`
state in `App.tsx` is per-session, not even per-restaurant yet). Model it
as chain-level menu templates that outlets inherit from and can override
locally — same shape as most POS systems' "master menu → outlet menu"
pattern.

## Later — real but not urgent

**8. Real tax engine.** GST is flat 5% everywhere right now
(`CATEGORY_DEFAULT_GST`). Actual restaurant GST depends on registration
type (composition scheme vs. regular), input tax credit eligibility, and
whether an item counts as "prepared food" vs. "packaged good" — this is a
rules engine keyed off the restaurant's tax profile, not the dish
category, and deserves its own module with its own compliance review
rather than a quick patch to `pricing.py`.

**9. Menu versioning / audit trail.** Every change to a live menu item
(price, availability, disable) should be attributable and revertible —
an `menu_item_events` append-log table, with the current item state as a
materialized view over it, is the standard shape.

**10. Approval workflow for chains.** An outlet manager adding an item
shouldn't necessarily make it live immediately if there's a chain-level
merchandising team — a `pending_review` state with `/feedback`-style
suggestions attached, so the reviewer sees exactly what was auto-detected
and what the merchant changed.

**11. Production hardening.** Rate limiting on `/suggest` and
`/autocomplete` (they're the endpoints hit on every keystroke), request
auth (currently none — anyone can call this API), structured logging and
tracing, and real object storage (S3/GCS + CDN) replacing the frontend's
data-URL image upload once there's a backend to receive uploads at all.

**12. Reuse the matcher for customer-facing search.** `name_similarity`
and the catalog scoring are equally applicable to "customer searches
'biriani' in the app and should still find 'Biryani'" — a smaller, natural
extension once this is a real service other parts of the product can call.
