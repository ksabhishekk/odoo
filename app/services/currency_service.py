def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """
    Temporary placeholder conversion.
    For now, if same currency -> same amount.
    Otherwise just multiply by a dummy rate for testing.
    Replace with live API later.
    """
    if from_currency == to_currency:
        return amount

    dummy_rates = {
        ("USD", "INR"): 83.0,
        ("EUR", "INR"): 90.0,
        ("INR", "USD"): 0.012,
        ("INR", "EUR"): 0.011
    }

    rate = dummy_rates.get((from_currency, to_currency), 1.0)
    return round(amount * rate, 2)