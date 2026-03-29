from pydantic import BaseModel
from typing import Optional, List

class RuleApproverInput(BaseModel):
    user_id: int
    sequence: int

class ApprovalRuleCreateRequest(BaseModel):
    rule_type: str   # sequential / percentage / specific / hybrid
    percentage_value: Optional[float] = None
    specific_approver_id: Optional[int] = None
    approvers: List[RuleApproverInput]

class RuleApproverResponse(BaseModel):
    user_id: int
    sequence: int

    class Config:
        from_attributes = True

class ApprovalRuleResponse(BaseModel):
    id: int
    company_id: int
    rule_type: str
    percentage_value: Optional[float]
    specific_approver_id: Optional[int]
    approvers: List[RuleApproverResponse]

    class Config:
        from_attributes = True