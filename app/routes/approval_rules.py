from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.approval_rule import ApprovalRuleCreateRequest
from app.services.approval_rule_service import (
    create_or_replace_approval_rule,
    get_company_approval_rule
)
from app.utils.dependencies import get_db, require_admin

router = APIRouter(prefix="/approval-rules", tags=["Approval Rules"])


@router.post("")
def create_rule(
    data: ApprovalRuleCreateRequest,
    admin_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rule, error = create_or_replace_approval_rule(data, admin_user.company_id, db)
    if error:
        raise HTTPException(status_code=400, detail=error)

    return {
        "id": rule.id,
        "company_id": rule.company_id,
        "rule_type": rule.rule_type,
        "percentage_value": rule.percentage_value,
        "specific_approver_id": rule.specific_approver_id,
        "approvers": [
            {
                "user_id": approver.user_id,
                "sequence": approver.sequence
            }
            for approver in sorted(rule.approvers, key=lambda x: x.sequence)
        ]
    }


@router.get("")
def get_rule(
    admin_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    rule = get_company_approval_rule(admin_user.company_id, db)
    if not rule:
        raise HTTPException(status_code=404, detail="No approval rule found")

    return {
        "id": rule.id,
        "company_id": rule.company_id,
        "rule_type": rule.rule_type,
        "percentage_value": rule.percentage_value,
        "specific_approver_id": rule.specific_approver_id,
        "approvers": [
            {
                "user_id": approver.user_id,
                "sequence": approver.sequence
            }
            for approver in sorted(rule.approvers, key=lambda x: x.sequence)
        ]
    }