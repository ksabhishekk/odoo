from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest
from app.utils.security import hash_password, verify_password, create_access_token

def signup_user(data: SignupRequest, db: Session):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        return None, "Email already registered"

    # Create company
    company = Company(
        name=data.company_name,
        country=data.country,
        default_currency=data.default_currency
    )
    db.add(company)
    db.flush()  # gets company.id before commit

    # Create admin user
    user = User(
        full_name=data.full_name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="admin",
        company_id=company.id,
        manager_id=None,
        is_manager_approver=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "user_id": user.id,
        "role": user.role,
        "company_id": user.company_id
    })

    return token, None

def login_user(data: LoginRequest, db: Session):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        return None, "Invalid email or password"

    token = create_access_token({
        "user_id": user.id,
        "role": user.role,
        "company_id": user.company_id
    })

    return token, None