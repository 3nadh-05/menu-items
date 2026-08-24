from app.pricing import check_price


def test_typical_price_not_flagged():
    result = check_price("Biryani & Rice", 249)
    assert result.is_outlier is False


def test_suspiciously_low_price_flagged():
    result = check_price("Biryani & Rice", 5)
    assert result.is_outlier is True
    assert "low" in result.message.lower()


def test_suspiciously_high_price_flagged():
    result = check_price("Beverages", 5000)
    assert result.is_outlier is True
    assert "high" in result.message.lower()


def test_unknown_category_uses_default_band():
    result = check_price("Some New Category", 40)
    assert result.is_outlier is False
