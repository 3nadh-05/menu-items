"""Pydantic request/response contracts for the menu-item detection API."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

FoodType = Literal["veg", "non-veg", "egg"]
SuggestionSource = Literal["catalog", "inferred", "manual", "learned"]


class Suggestion(BaseModel):
    type: FoodType
    category: str
    subcategory: str
    gst: float
    source: SuggestionSource
    confidence: float = Field(ge=0, le=1)
    matched_dish: Optional[str] = None


class SuggestRequest(BaseModel):
    name: str
    restaurant_id: Optional[str] = Field(
        default=None,
        description="When set, the merchant's own correction history is consulted before the shared catalog.",
    )


class AutocompleteResult(BaseModel):
    name: str
    category: str
    type: FoodType


class BulkTextRequest(BaseModel):
    text: str = Field(description="Raw pasted menu, one item per line, e.g. 'Chicken Biryani - 249'.")
    restaurant_id: Optional[str] = None


class BulkRow(BaseModel):
    raw_line: str
    name: str
    price: Optional[float]
    suggestion: Suggestion
    duplicate_of: Optional[str] = None
    price_flag: Optional[str] = None


class BulkResult(BaseModel):
    rows: list[BulkRow]
    ready_count: int


class FeedbackRequest(BaseModel):
    restaurant_id: str
    name: str
    corrected: Suggestion


class DuplicateCheckRequest(BaseModel):
    name: str
    existing_item_names: list[str]


class DuplicateMatch(BaseModel):
    existing_item_name: str
    similarity: float = Field(ge=0, le=1)


class PriceCheckRequest(BaseModel):
    category: str
    price: float


class PriceCheckResult(BaseModel):
    is_outlier: bool
    expected_min: float
    expected_max: float
    message: Optional[str] = None
