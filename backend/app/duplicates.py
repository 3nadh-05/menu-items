"""Warn a merchant when a new item looks like one already on their menu.

Reuses the same name-similarity primitive as the detection engine (see
``matching.name_similarity``) rather than a separate algorithm — a
duplicate is, definitionally, an item whose name is very close to an
existing one, which is the same signal the catalog matcher already
computes. Kept as its own module because the comparison set here is a
single restaurant's live menu, not the shared catalog, and the threshold
for "flag this" is intentionally stricter than the threshold for
"auto-fill this" (a near-miss should still get auto-filled; it should not
necessarily be rejected as a duplicate).
"""

from __future__ import annotations

from .matching import name_similarity

DUPLICATE_THRESHOLD = 0.82


def find_duplicates(name: str, existing_item_names: list[str], threshold: float = DUPLICATE_THRESHOLD) -> list[tuple[str, float]]:
    """Return existing items similar enough to `name` to warrant a warning,
    most-similar first. Empty list means "looks distinct, safe to add"."""
    scored = ((existing, name_similarity(name, existing)) for existing in existing_item_names)
    return sorted((pair for pair in scored if pair[1] >= threshold), key=lambda p: p[1], reverse=True)
