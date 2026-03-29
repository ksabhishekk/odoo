from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str   # admin / manager / employee
    manager_id: Optional[int] = None
    is_manager_approver: bool = True

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    manager_id: Optional[int] = None
    is_manager_approver: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    company_id: int
    manager_id: Optional[int]
    is_manager_approver: bool

    class Config:
        from_attributes = True