from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ExpenseCreateRequest(BaseModel):
    amount_original: float
    currency_original: str
    category: str
    description: Optional[str] = None
    expense_date: date

class ApprovalStepResponse(BaseModel):
    id: int
    approver_id: int
    step_order: int
    status: str
    comment: Optional[str]
    action_time: Optional[datetime]

    class Config:
        from_attributes = True

class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    amount_original: float
    currency_original: str
    amount_converted: float
    currency_converted: str
    category: str
    description: Optional[str]
    expense_date: date
    status: str
    current_step: int
    approval_steps: List[ApprovalStepResponse] = []

    class Config:
        from_attributes = True


class ExpenseActionRequest(BaseModel):
    action: str   # approve / reject
    comment: Optional[str] = None