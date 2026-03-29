import requests

def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """
    Convert amount from one currency to another using ExchangeRate API.
    """
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()

    # If same currency, no conversion needed
    if from_currency == to_currency:
        return round(amount, 2)

    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise Exception("Currency API failed")

        data = response.json()
        rates = data.get("rates", {})

        if to_currency not in rates:
            raise Exception(f"Target currency {to_currency} not found")

        converted = amount * rates[to_currency]
        return round(converted, 2)

    except Exception as e:
        print("Currency conversion error:", str(e))

        # Fallback: return same amount to avoid breaking expense submission
        return round(amount, 2)