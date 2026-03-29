from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserUpdateRequest
from app.utils.security import hash_password

def get_company_users(company_id: int, db: Session):
    return db.query(User).filter(User.company_id == company_id).all()

def create_company_user(data: UserCreateRequest, company_id: int, db: Session):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        return None, "Email already registered"

    # Optional validation for role
    if data.role not in ["admin", "manager", "employee"]:
        return None, "Invalid role"

    # Optional validation for manager_id
    if data.manager_id:
        manager = db.query(User).filter(
            User.id == data.manager_id,
            User.company_id == company_id
        ).first()
        if not manager:
            return None, "Assigned manager not found in company"

    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        company_id=company_id,
        manager_id=data.manager_id,
        is_manager_approver=data.is_manager_approver
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user, None

def update_company_user(user_id: int, company_id: int, data: UserUpdateRequest, db: Session):
    user = db.query(User).filter(
        User.id == user_id,
        User.company_id == company_id
    ).first()

    if not user:
        return None, "User not found"

    if data.full_name is not None:
        user.full_name = data.full_name

    if data.role is not None:
        if data.role not in ["admin", "manager", "employee"]:
            return None, "Invalid role"
        user.role = data.role

    if data.manager_id is not None:
        if data.manager_id == user.id:
            return None, "User cannot be their own manager"

        if data.manager_id:
            manager = db.query(User).filter(
                User.id == data.manager_id,
                User.company_id == company_id
            ).first()
            if not manager:
                return None, "Assigned manager not found in company"

        user.manager_id = data.manager_id

    if data.is_manager_approver is not None:
        user.is_manager_approver = data.is_manager_approver

    db.commit()
    db.refresh(user)

    return user, None