from app.duplicates import find_duplicates


def test_near_identical_name_flagged():
    hits = find_duplicates("Chicken Biryani (Half)", ["Chicken Biryani", "Paneer Tikka"])
    assert hits
    assert hits[0][0] == "Chicken Biryani"


def test_distinct_names_not_flagged():
    assert find_duplicates("Paneer Tikka", ["Chicken Biryani", "Masala Dosa"]) == []


def test_empty_menu_never_flags():
    assert find_duplicates("Anything", []) == []
