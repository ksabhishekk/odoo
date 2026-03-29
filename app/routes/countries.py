from fastapi import APIRouter
from app.services.country_service import fetch_countries_and_currencies

router = APIRouter(prefix="/countries", tags=["Countries"])


@router.get("")
def get_countries():
    return fetch_countries_and_currencies()