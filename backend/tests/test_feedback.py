from app.feedback import FeedbackStore
from app.matching import Suggestion


def test_correction_is_scoped_to_its_own_restaurant():
    store = FeedbackStore()
    correction = Suggestion("veg", "Specials", "Thali", 5, "manual", 1.0)
    store.record_correction("resto-1", "Chef's Thali", correction)

    assert store.lookup("resto-1", "Chef's Thali") is not None
    assert store.lookup("resto-2", "Chef's Thali") is None


def test_lookup_returns_learned_source_with_full_confidence():
    store = FeedbackStore()
    correction = Suggestion("veg", "Specials", "Thali", 5, "manual", 1.0)
    store.record_correction("resto-1", "Chef's Thali", correction)

    learned = store.lookup("resto-1", "Chef's Thali")
    assert learned.source == "learned"
    assert learned.confidence == 1.0
    assert learned.category == "Specials"


def test_catalog_gap_candidates_require_multiple_restaurants():
    store = FeedbackStore()
    correction = Suggestion("veg", "Regional Specials", "Thali", 5, "manual", 1.0)
    for resto in ["resto-1", "resto-2"]:
        store.record_correction(resto, "Sadya", correction)

    assert store.catalog_gap_candidates(min_restaurants=3) == []
    assert store.catalog_gap_candidates(min_restaurants=2)
