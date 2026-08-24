"""FastAPI service exposing the menu-item detection engine.

Run locally with:

    uvicorn app.main:app --reload --port 8000

Then see /docs for interactive Swagger UI. This is the reference backend
implementation described in docs/ARCHITECTURE.md — the React prototype in
../src keeps its own TypeScript copy of the same algorithm because a
published Artifact preview cannot call out to an external server, but a
real deployment should have the frontend call this service instead of
carrying the logic twice. See docs/ROADMAP.md, "Single source of truth".
"""

from __future__ import annotations

import json
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import bulk_import, catalog, duplicates, matching, pricing
from .feedback import feedback_store
from .schemas import (
    AutocompleteResult,
    BulkResult,
    BulkTextRequest,
    DuplicateCheckRequest,
    DuplicateMatch,
    FeedbackRequest,
    PriceCheckRequest,
    PriceCheckResult,
    Suggestion,
    SuggestRequest,
)

app = FastAPI(
    title="Menu Item Detection API",
    description="Auto-categorization engine for restaurant menu items: type, category, GST detection plus duplicate and price-sanity checks.",
    version="1.0.0",
)

# Local-dev default — lock this down to the actual frontend origin(s) in production (see docs/ARCHITECTURE.md, "Deployment").
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _to_suggestion_out(s: matching.Suggestion) -> Suggestion:
    return Suggestion(**s.__dict__)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/categories", response_model=list[str])
def list_categories() -> list[str]:
    return catalog.CATEGORIES


@app.get("/categories/{category}/subcategories", response_model=list[str])
def list_subcategories(category: str) -> list[str]:
    return catalog.subcategories_for(category)


@app.post("/suggest", response_model=Suggestion)
def suggest(req: SuggestRequest) -> Suggestion:
    if req.restaurant_id:
        learned = feedback_store.lookup(req.restaurant_id, req.name)
        if learned is not None:
            return _to_suggestion_out(learned)
    return _to_suggestion_out(matching.suggest_for(req.name))


@app.get("/autocomplete", response_model=list[AutocompleteResult])
def autocomplete(q: str = Query(..., min_length=1), limit: int = Query(6, ge=1, le=25)) -> list[AutocompleteResult]:
    return [AutocompleteResult(name=d.name, category=d.category, type=d.type) for d in matching.autocomplete(q, limit)]


@app.post("/bulk/text", response_model=BulkResult)
def bulk_from_text(req: BulkTextRequest) -> BulkResult:
    parsed = bulk_import.parse_text(req.text)
    rows = bulk_import.build_bulk_rows(parsed, req.restaurant_id, existing_item_names=[])
    return BulkResult(rows=rows, ready_count=sum(1 for r in rows if r.price and r.price > 0))


@app.post("/bulk/file", response_model=BulkResult)
async def bulk_from_file(
    file: UploadFile = File(...),
    restaurant_id: Optional[str] = Form(None),
    existing_item_names: Optional[str] = Form(None, description="JSON array of item names already on the menu, for duplicate checking."),
) -> BulkResult:
    contents = await file.read()
    try:
        parsed = bulk_import.parse_spreadsheet(contents, file.filename or "upload.csv")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    existing = json.loads(existing_item_names) if existing_item_names else []
    rows = bulk_import.build_bulk_rows(parsed, restaurant_id, existing_item_names=existing)
    return BulkResult(rows=rows, ready_count=sum(1 for r in rows if r.price and r.price > 0))


@app.post("/duplicates/check", response_model=list[DuplicateMatch])
def check_duplicates(req: DuplicateCheckRequest) -> list[DuplicateMatch]:
    return [DuplicateMatch(existing_item_name=name, similarity=score) for name, score in duplicates.find_duplicates(req.name, req.existing_item_names)]


@app.post("/pricing/check", response_model=PriceCheckResult)
def check_price(req: PriceCheckRequest) -> PriceCheckResult:
    result = pricing.check_price(req.category, req.price)
    return PriceCheckResult(is_outlier=result.is_outlier, expected_min=result.expected_min, expected_max=result.expected_max, message=result.message)


@app.post("/feedback", status_code=204)
def submit_feedback(req: FeedbackRequest) -> None:
    corrected = matching.Suggestion(**req.corrected.model_dump())
    feedback_store.record_correction(req.restaurant_id, req.name, corrected)


@app.get("/feedback/catalog-gaps")
def catalog_gaps(min_restaurants: int = Query(3, ge=1)) -> list[dict]:
    """Dishes independently corrected the same way by enough restaurants to be worth adding to the shared catalog."""
    return [
        {"name": name, "category": category, "restaurant_count": count}
        for name, category, count in feedback_store.catalog_gap_candidates(min_restaurants)
    ]
