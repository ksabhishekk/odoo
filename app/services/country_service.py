import requests

def fetch_countries_and_currencies():
    """
    Fetch country + currency data from RestCountries API.
    """
    url = "https://restcountries.com/v3.1/all?fields=name,currencies"

    try:
        response = requests.get(url, timeout=15)

        if response.status_code != 200:
            raise Exception("Failed to fetch countries")

        data = response.json()
        result = []

        for item in data:
            country_name = item.get("name", {}).get("common")

            currencies = item.get("currencies", {})
            if not country_name or not currencies:
                continue

            for code, details in currencies.items():
                result.append({
                    "country": country_name,
                    "currency_code": code,
                    "currency_name": details.get("name", "")
                })

        # Sort nicely
        result.sort(key=lambda x: (x["country"], x["currency_code"]))

        return result

    except Exception as e:
        print("Country API error:", str(e))
        return []