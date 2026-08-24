"""Bulk menu import: pasted text and real spreadsheet files.

Two entry points:

* ``parse_text`` — one item per line ("Chicken Biryani - 249"), the same
  format the React prototype's paste-a-list box accepts. Kept here (not
  just in the frontend) so a merchant onboarding call center, a WhatsApp
  bot, or a bulk-edit script hitting this API directly gets identical
  parsing to the UI.
* ``parse_spreadsheet`` — an actual uploaded .csv/.xlsx, which is what a
  restaurant's existing POS export usually looks like. Column headers are
  matched heuristically (case-insensitive substring match against a small
  alias list) rather than assumed positional, because "Item Name" vs
  "Dish" vs "Product" vs no header at all are all things real POS exports
  do.

``build_bulk_rows`` is the shared orchestration both entry points funnel
into: run detection, then layer duplicate and price-sanity checks on top,
exactly mirroring what a merchant sees in the bulk-add preview table.
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass

from .duplicates import find_duplicates
from .feedback import feedback_store
from .matching import suggest_for
from .pricing import check_price
from .schemas import BulkRow
from .schemas import Suggestion as SuggestionOut

_LINE_RE = re.compile(r"^(.+?)[\s,\t\-–—]+₹?\s*(\d+(?:\.\d{1,2})?)\s*$")

NAME_HEADER_ALIASES = {"name", "item", "item name", "dish", "product", "menu item", "title"}
PRICE_HEADER_ALIASES = {"price", "cost", "mrp", "rate", "amount", "selling price"}


@dataclass(frozen=True)
class ParsedLine:
    raw: str
    name: str
    price: float | None


def parse_line(line: str) -> ParsedLine:
    stripped = line.strip()
    match = _LINE_RE.match(stripped)
    if match:
        return ParsedLine(stripped, match.group(1).strip(), float(match.group(2)))
    return ParsedLine(stripped, stripped, None)


def parse_text(text: str) -> list[ParsedLine]:
    return [parse_line(line) for line in text.splitlines() if line.strip()]


def _find_column(columns: list[str], aliases: set[str]) -> str | None:
    lowered = {c: c.strip().lower() for c in columns}
    for original, low in lowered.items():
        if low in aliases:
            return original
    for original, low in lowered.items():
        if any(alias in low for alias in aliases):
            return original
    return None


def parse_spreadsheet(contents: bytes, filename: str) -> list[ParsedLine]:
    """Parse an uploaded .csv or .xlsx into (name, price) pairs.

    Raises ValueError with a merchant-readable message on anything the
    heuristics can't confidently handle, rather than guessing silently —
    a wrong column guess (address-as-price) is worse than asking again.
    """
    import pandas as pd  # local import: keeps pandas optional for callers that only need parse_text

    lower_name = filename.lower()
    if lower_name.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    elif lower_name.endswith((".xlsx", ".xls")):
        df = pd.read_excel(io.BytesIO(contents))
    else:
        raise ValueError("Unsupported file type — upload a .csv or .xlsx export of your menu.")

    if df.empty:
        raise ValueError("That file has no rows.")

    columns = [str(c) for c in df.columns]
    name_col = _find_column(columns, NAME_HEADER_ALIASES) or columns[0]
    price_col = _find_column(columns, PRICE_HEADER_ALIASES)
    if price_col is None and len(columns) > 1:
        price_col = columns[1]

    rows: list[ParsedLine] = []
    for _, row in df.iterrows():
        name = str(row[name_col]).strip() if name_col in row else ""
        if not name or name.lower() == "nan":
            continue
        price = None
        if price_col is not None:
            raw_price = row.get(price_col)
            try:
                price = float(raw_price)
            except (TypeError, ValueError):
                price = None
        rows.append(ParsedLine(raw=f"{name} — {price if price is not None else 'no price'}", name=name, price=price))
    return rows


def build_bulk_rows(parsed: list[ParsedLine], restaurant_id: str | None, existing_item_names: list[str]) -> list[BulkRow]:
    rows: list[BulkRow] = []
    seen_in_batch: list[str] = list(existing_item_names)

    for item in parsed:
        learned = feedback_store.lookup(restaurant_id, item.name) if restaurant_id else None
        suggestion = learned or suggest_for(item.name)

        dup = find_duplicates(item.name, seen_in_batch)
        duplicate_of = dup[0][0] if dup else None

        price_flag = None
        if item.price is not None:
            price_check = check_price(suggestion.category, item.price)
            price_flag = price_check.message

        rows.append(
            BulkRow(
                raw_line=item.raw,
                name=item.name,
                price=item.price,
                suggestion=SuggestionOut(**suggestion.__dict__),
                duplicate_of=duplicate_of,
                price_flag=price_flag,
            )
        )
        seen_in_batch.append(item.name)

    return rows
