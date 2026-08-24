from app.matching import autocomplete, name_similarity, stem, suggest_for, tokenize


def test_exact_catalog_match_is_high_confidence():
    s = suggest_for("Chicken Biryani")
    assert s.source == "catalog"
    assert s.category == "Biryani & Rice"
    assert s.type == "non-veg"
    assert s.confidence >= 0.9


def test_typo_still_resolves_to_the_right_dish():
    s = suggest_for("Chiken Biriyani")
    assert s.matched_dish == "Chicken Biryani"
    assert s.category == "Biryani & Rice"


def test_plural_is_stemmed():
    assert stem("idlis") == "idli"
    assert stem("fries") == "fry"
    assert stem("curries") == "curry"


def test_unknown_dish_falls_back_to_a_related_catalog_dish():
    # "Curry" + "Chicken" overlap enough with "Chicken Curry" to win as a
    # (medium-confidence) catalog match rather than dropping to keyword inference.
    s = suggest_for("Spicy Chicken Curry Bowl")
    assert s.source == "catalog"
    assert s.matched_dish == "Chicken Curry"
    assert s.category == "Main Course"
    assert s.type == "non-veg"
    assert 0.3 <= s.confidence < 0.9


def test_dish_with_no_catalog_overlap_falls_back_to_keyword_category():
    # "pulao" is a category trigger word but appears in no catalog dish's own
    # keywords, so this has to fall all the way through to keyword inference.
    s = suggest_for("House Special Pulao")
    assert s.source == "inferred"
    assert s.category == "Biryani & Rice"
    assert s.type == "veg"


def test_veg_non_veg_egg_detected_from_name_alone():
    assert suggest_for("Random House Special Chicken Dish").type == "non-veg"
    assert suggest_for("Random House Special Egg Dish").type == "egg"
    assert suggest_for("Random House Special Dish").type == "veg"


def test_completely_unrecognized_name_gets_safe_manual_default():
    s = suggest_for("Xyzzy Frobnicator")
    assert s.source == "manual"
    assert s.confidence == 0


def test_empty_name_gets_manual_default():
    s = suggest_for("   ")
    assert s.source == "manual"


def test_autocomplete_prefix_and_fuzzy():
    prefix_hits = autocomplete("Chicken Bir")
    assert any(d.name == "Chicken Biryani" for d in prefix_hits)

    typo_hits = autocomplete("Chiken Biryni")
    assert any(d.name == "Chicken Biryani" for d in typo_hits)


def test_autocomplete_requires_minimum_length():
    assert autocomplete("c") == []


def test_name_similarity_symmetric_bounds():
    assert name_similarity("Chicken Biryani", "Chicken Biryani") == 1.0
    assert 0 <= name_similarity("Paneer Tikka", "Chicken Biryani") < 0.5


def test_tokenize_lowercases_and_splits_on_punctuation():
    assert tokenize("Chicken-Biryani, Family Pack!") == ["chicken", "biryani", "family", "pack"]
