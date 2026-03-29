from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.services.auth_service import signup_user, login_user
from app.utils.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    try:
        token, error = signup_user(data, db)
        if error:
            raise HTTPException(status_code=400, detail=error)
        return {"access_token": token}
    except Exception as e:
        print("SIGNUP ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    try:
        token, error = login_user(data, db)
        if error:
            raise HTTPException(status_code=401, detail=error)
        return {"access_token": token}
    except Exception as e:
        print("LOGIN ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))