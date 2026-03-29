from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }

@router.get("/admin-only")
def admin_only(user = Depends(require_admin)):
    return {"message": "You are an admin"}