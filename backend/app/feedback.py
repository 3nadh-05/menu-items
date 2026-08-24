"""Per-restaurant learning loop.

When a merchant overrides an auto-suggested category/type, that correction
is worth remembering: the same restaurant will type the same dish name
again, and the shared catalog will never learn a house-specific name
("Chef's Special Thali") on its own. This module is the seed of that loop —
an in-memory store today, a ``restaurant_corrections`` table tomorrow.

Deliberately NOT a global catalog write: one restaurant's correction should
never silently change what another restaurant sees, which is why lookups
are keyed by ``(restaurant_id, normalized_name)`` rather than mutating the
shared ``CATALOG``. A correction seen from enough distinct restaurants is a
signal the *shared* catalog is missing a dish — see docs/ROADMAP.md.
"""

from __future__ import annotations

from collections import defaultdict
from threading import Lock

from .matching import Suggestion, squash


class FeedbackStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._by_restaurant: dict[str, dict[str, Suggestion]] = defaultdict(dict)
        # normalized name -> count of distinct restaurants that corrected it the same way,
        # used to flag "the shared catalog should probably learn this dish".
        self._cross_restaurant_hits: dict[tuple[str, str], set[str]] = defaultdict(set)

    def record_correction(self, restaurant_id: str, name: str, corrected: Suggestion) -> None:
        key = squash(name)
        with self._lock:
            self._by_restaurant[restaurant_id][key] = corrected
            self._cross_restaurant_hits[(key, corrected.category)].add(restaurant_id)

    def lookup(self, restaurant_id: str, name: str) -> Suggestion | None:
        key = squash(name)
        with self._lock:
            learned = self._by_restaurant.get(restaurant_id, {}).get(key)
        if learned is None:
            return None
        return Suggestion(
            type=learned.type,
            category=learned.category,
            subcategory=learned.subcategory,
            gst=learned.gst,
            source="learned",
            confidence=1.0,
            matched_dish=None,
        )

    def catalog_gap_candidates(self, min_restaurants: int = 3) -> list[tuple[str, str, int]]:
        """Dish names corrected the same way by enough independent restaurants
        to be worth promoting into the shared catalog by a content curator."""
        with self._lock:
            return sorted(
                (
                    (name, category, len(restaurants))
                    for (name, category), restaurants in self._cross_restaurant_hits.items()
                    if len(restaurants) >= min_restaurants
                ),
                key=lambda row: row[2],
                reverse=True,
            )


# Process-local singleton — swap for a real table-backed store behind the
# same two methods when this moves off a single API instance.
feedback_store = FeedbackStore()
