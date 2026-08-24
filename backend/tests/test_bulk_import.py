import io

from app.bulk_import import build_bulk_rows, parse_line, parse_spreadsheet, parse_text


def test_parse_line_handles_dash_comma_and_bare_space_separators():
    assert parse_line("Chicken Biryani - 249") == parse_line("Chicken Biryani - 249")
    dash = parse_line("Chicken Biryani - 249")
    comma = parse_line("Paneer Tikka, 199")
    bare = parse_line("Masala Dosa 120")
    assert (dash.name, dash.price) == ("Chicken Biryani", 249.0)
    assert (comma.name, comma.price) == ("Paneer Tikka", 199.0)
    assert (bare.name, bare.price) == ("Masala Dosa", 120.0)


def test_parse_line_without_a_price_keeps_the_name():
    parsed = parse_line("Chef's Special Thali")
    assert parsed.name == "Chef's Special Thali"
    assert parsed.price is None


def test_parse_text_skips_blank_lines():
    parsed = parse_text("Chicken Biryani - 249\n\nMasala Dosa 120\n")
    assert len(parsed) == 2


def test_build_bulk_rows_detects_category_and_flags_duplicates_and_price():
    parsed = parse_text("Chicken Biryani - 5\nMasala Dosa 120")
    rows = build_bulk_rows(parsed, restaurant_id=None, existing_item_names=["Chicken Biryani"])

    biryani = rows[0]
    assert biryani.suggestion.category == "Biryani & Rice"
    assert biryani.duplicate_of == "Chicken Biryani"
    assert biryani.price_flag is not None  # ₹5 biryani should trip the price sanity check

    dosa = rows[1]
    assert dosa.suggestion.category == "South Indian"
    assert dosa.duplicate_of is None
    assert dosa.price_flag is None


def test_parse_spreadsheet_csv_with_recognizable_headers():
    csv_bytes = b"Item Name,Price\nChicken Biryani,249\nMasala Dosa,120\n"
    parsed = parse_spreadsheet(csv_bytes, "menu.csv")
    assert [p.name for p in parsed] == ["Chicken Biryani", "Masala Dosa"]
    assert [p.price for p in parsed] == [249.0, 120.0]


def test_parse_spreadsheet_rejects_unsupported_extension():
    try:
        parse_spreadsheet(b"whatever", "menu.txt")
        assert False, "expected ValueError"
    except ValueError:
        pass
