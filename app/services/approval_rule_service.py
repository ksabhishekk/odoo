from sqlalchemy.orm import Session
from app.models.approval_rule import ApprovalRule
from app.models.rule_approver import RuleApprover
from app.models.user import User
from app.schemas.approval_rule import ApprovalRuleCreateRequest

VALID_RULE_TYPES = ["sequential", "percentage", "specific", "hybrid"]

def create_or_replace_approval_rule(data: ApprovalRuleCreateRequest, company_id: int, db: Session):
    if data.rule_type not in VALID_RULE_TYPES:
        return None, "Invalid rule type"

    if data.rule_type in ["percentage", "hybrid"] and data.percentage_value is None:
        return None, "percentage_value is required for percentage/hybrid rules"

    if data.rule_type in ["specific", "hybrid"] and data.specific_approver_id is None:
        return None, "specific_approver_id is required for specific/hybrid rules"

    # Validate all approvers belong to same company
    for approver in data.approvers:
        user = db.query(User).filter(
            User.id == approver.user_id,
            User.company_id == company_id
        ).first()
        if not user:
            return None, f"Approver {approver.user_id} not found in company"

    # Validate specific approver if provided
    if data.specific_approver_id:
        specific_user = db.query(User).filter(
            User.id == data.specific_approver_id,
            User.company_id == company_id
        ).first()
        if not specific_user:
            return None, "Specific approver not found in company"

    # Delete old rule if exists
    old_rule = db.query(ApprovalRule).filter(ApprovalRule.company_id == company_id).first()
    if old_rule:
        db.delete(old_rule)
        db.commit()

    # Create new rule
    rule = ApprovalRule(
        company_id=company_id,
        rule_type=data.rule_type,
        percentage_value=data.percentage_value,
        specific_approver_id=data.specific_approver_id
    )
    db.add(rule)
    db.flush()

    # Add approvers
    for approver in data.approvers:
        db.add(RuleApprover(
            rule_id=rule.id,
            user_id=approver.user_id,
            sequence=approver.sequence
        ))

    db.commit()
    db.refresh(rule)
    return rule, None


def get_company_approval_rule(company_id: int, db: Session):
    rule = db.query(ApprovalRule).filter(ApprovalRule.company_id == company_id).first()
    return rule