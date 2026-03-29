from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserResponse
from app.services.user_service import (
    get_company_users,
    create_company_user,
    update_company_user
)
from app.utils.dependencies import get_db, get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
def get_me(current_user = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "company_id": current_user.company_id,
        "manager_id": current_user.manager_id,
        "is_manager_approver": current_user.is_manager_approver
    }


@router.get("", response_model=list[UserResponse])
def get_users(
    admin_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_company_users(admin_user.company_id, db)


@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreateRequest,
    admin_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user, error = create_company_user(data, admin_user.company_id, db)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdateRequest,
    admin_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user, error = update_company_user(user_id, admin_user.company_id, data, db)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return user


@router.get("/admin-only")
def admin_only(user = Depends(require_admin)):
    return {"message": "You are an admin"}