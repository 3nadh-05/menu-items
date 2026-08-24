# Menu Item Detection API (Python)

Reference backend implementation of the auto-categorization engine
described in `../docs/ALGORITHM.md`. This is a faithful port of the
TypeScript logic in `../src/lib/match.ts`, plus four things a real backend
needs that a client-only prototype doesn't: duplicate detection, price
sanity checks, a per-restaurant feedback/learning loop, and real
spreadsheet (CSV/XLSX) bulk import.

## Quickstart

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# run the API
uvicorn app.main:app --reload --port 8000
# -> http://localhost:8000/docs for interactive Swagger UI

# run the tests
pytest
```

## Layout

| File | Responsibility |
|---|---|
| `app/catalog.py` | The master dish catalog (~110 dishes) and category → default GST table. |
| `app/matching.py` | The detection algorithm: stemming, Levenshtein similarity, scoring, category/type inference. Exposes a `MatchProvider` interface so a future embedding-based matcher can be swapped in without touching callers. |
| `app/feedback.py` | Per-restaurant correction memory — the seed of a learning loop (see `docs/ROADMAP.md`). |
| `app/duplicates.py` | Flags a new item as a likely duplicate of one already on the same restaurant's menu. |
| `app/pricing.py` | Category-level price sanity check (catches missing/extra digits). |
| `app/bulk_import.py` | Parses pasted text and uploaded CSV/XLSX files, then runs every row through detection + duplicate + price checks. |
| `app/main.py` | FastAPI routes tying the above together. |
| `tests/` | pytest coverage for every module above, plus end-to-end API tests. |

## Why this exists alongside the TypeScript version

The React prototype (`../src`) is published as a static Artifact preview,
which cannot call out to an external server — so it carries its own copy
of the algorithm in TypeScript purely to stay demoable as a single HTML
file. This Python service is the one meant to actually run in production;
`docs/ARCHITECTURE.md` covers how the two should converge (frontend calls
this API instead of duplicating the logic) once this stops being a
prototype.
