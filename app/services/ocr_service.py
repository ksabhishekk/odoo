import re
import pytesseract
from PIL import Image
from datetime import datetime

# IMPORTANT for Windows:
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_receipt_data(image_path: str):
    """
    Extract text and basic fields from a receipt image.
    Tries to detect:
    - merchant
    - amount
    - date
    """
    try:
        image = Image.open(image_path)
        raw_text = pytesseract.image_to_string(image)

        merchant = extract_merchant(raw_text)
        amount = extract_amount(raw_text)
        date_value = extract_date(raw_text)

        return {
            "raw_text": raw_text,
            "merchant": merchant,
            "amount": amount,
            "date": date_value
        }

    except Exception as e:
        return {
            "raw_text": "",
            "merchant": None,
            "amount": None,
            "date": None,
            "error": str(e)
        }


def extract_merchant(text: str):
    """
    Naive heuristic:
    Take first non-empty line as merchant.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    return lines[0] if lines else None


def extract_amount(text: str):
    """
    Try to detect the most likely total amount.
    Looks for TOTAL or fallback to largest decimal number.
    """
    lines = text.split("\n")

    # First try lines containing TOTAL / AMOUNT
    for line in lines:
        if "TOTAL" in line.upper() or "AMOUNT" in line.upper():
            matches = re.findall(r"\d+[.,]?\d*", line)
            if matches:
                try:
                    return float(matches[-1].replace(",", ""))
                except:
                    pass

    # Fallback: find all decimal-like numbers and pick the largest
    all_numbers = re.findall(r"\d+[.,]\d{2}", text)
    values = []

    for num in all_numbers:
        try:
            values.append(float(num.replace(",", "")))
        except:
            pass

    return max(values) if values else None


def extract_date(text: str):
    """
    Try to detect common receipt date formats and convert to YYYY-MM-DD.
    """
    patterns = [
        r"\b\d{2}/\d{2}/\d{4}\b",   # 29/03/2026
        r"\b\d{2}-\d{2}-\d{4}\b",   # 29-03-2026
        r"\b\d{4}-\d{2}-\d{2}\b",   # 2026-03-29
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            raw_date = match.group()

            for fmt in ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"]:
                try:
                    parsed = datetime.strptime(raw_date, fmt)
                    return parsed.date().isoformat()
                except:
                    continue

    return None