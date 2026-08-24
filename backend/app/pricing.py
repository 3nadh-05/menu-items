"""Category-level price sanity check.

Catches the two costliest data-entry mistakes in menu onboarding: a
misplaced decimal (₹1200 Masala Chai) and a missing digit (₹5 Chicken
Biryani). ``CATEGORY_PRICE_BANDS`` below is a stand-in for what a real
deployment would compute from actual order history (e.g. the 5th/95th
percentile observed price per category, refreshed nightly) — the shape of
the check does not change when that swap happens, only where the numbers
come from.

This is a soft warning, not a hard validation: outside the band is
flagged, never blocked, because a genuinely premium or a genuinely
budget item is a real, valid menu item.
"""

from __future__ import annotations

from dataclasses import dataclass

# category -> (typical_min, typical_max) in INR, e.g. from trailing order history.
CATEGORY_PRICE_BANDS: dict[str, tuple[float, float]] = {
    "Biryani & Rice": (120, 450),
    "Starters": (80, 350),
    "Main Course": (100, 400),
    "Breads": (20, 80),
    "South Indian": (30, 150),
    "Chinese": (100, 350),
    "Desserts": (30, 150),
    "Beverages": (15, 150),
    "Breakfast": (20, 150),
    "Fast Food": (60, 400),
}
DEFAULT_BAND = (20, 500)

# How far outside the typical band a price has to be before we actually flag it.
LOW_SLACK = 0.5
HIGH_SLACK = 1.6


@dataclass(frozen=True)
class PriceCheck:
    is_outlier: bool
    expected_min: float
    expected_max: float
    message: str | None = None


def check_price(category: str, price: float) -> PriceCheck:
    band_min, band_max = CATEGORY_PRICE_BANDS.get(category, DEFAULT_BAND)

    if price < band_min * LOW_SLACK:
        return PriceCheck(True, band_min, band_max, f"That's low for {category} — most items here run ₹{band_min:.0f}–₹{band_max:.0f}. Check for a missing digit.")
    if price > band_max * HIGH_SLACK:
        return PriceCheck(True, band_min, band_max, f"That's high for {category} — most items here run ₹{band_min:.0f}–₹{band_max:.0f}. Check for an extra digit or a decimal slip.")
    return PriceCheck(False, band_min, band_max, None)
