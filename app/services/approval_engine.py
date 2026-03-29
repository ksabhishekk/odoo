from sqlalchemy.orm import Session
from datetime import datetime

from app.models.user import User
from app.models.approval_rule import ApprovalRule
from app.models.rule_approver import RuleApprover
from app.models.approval_step import ApprovalStep
from app.models.expense import Expense


def generate_approval_steps(expense, employee: User, db: Session):
    """
    Generates ApprovalStep rows for a newly created expense.
    Order:
    1. Employee's manager first (if is_manager_approver = True)
    2. Company rule approvers in sequence
    """

    step_order = 1
    used_approver_ids = set()

    # 1. Add direct manager first if required
    if employee.is_manager_approver and employee.manager_id:
        db.add(ApprovalStep(
            expense_id=expense.id,
            approver_id=employee.manager_id,
            step_order=step_order,
            status="pending"
        ))
        used_approver_ids.add(employee.manager_id)
        step_order += 1

    # 2. Get company approval rule
    rule = db.query(ApprovalRule).filter(
        ApprovalRule.company_id == employee.company_id
    ).first()

    if not rule:
        return

    rule_approvers = db.query(RuleApprover).filter(
        RuleApprover.rule_id == rule.id
    ).order_by(RuleApprover.sequence.asc()).all()

    for approver in rule_approvers:
        if approver.user_id in used_approver_ids:
            continue

        db.add(ApprovalStep(
            expense_id=expense.id,
            approver_id=approver.user_id,
            step_order=step_order,
            status="pending"
        ))
        used_approver_ids.add(approver.user_id)
        step_order += 1


def evaluate_approval_rule(expense: Expense, db: Session):
    """
    Evaluates whether an expense should now be approved
    based on the company's configured rule.
    """
    rule = db.query(ApprovalRule).filter(
        ApprovalRule.company_id == expense.company_id
    ).first()

    steps = db.query(ApprovalStep).filter(
        ApprovalStep.expense_id == expense.id
    ).order_by(ApprovalStep.step_order.asc()).all()

    approved_steps = [s for s in steps if s.status == "approved"]
    rejected_steps = [s for s in steps if s.status == "rejected"]

    # If any rejection happened, reject immediately
    if rejected_steps:
        expense.status = "rejected"
        return "rejected"

    if not rule:
        # No rule => sequential fallback
        if all(step.status == "approved" for step in steps):
            expense.status = "approved"
            return "approved"
        return "pending"

    total_steps = len(steps)
    approved_count = len(approved_steps)

    # ---- Sequential Rule ----
    if rule.rule_type == "sequential":
        if all(step.status == "approved" for step in steps):
            expense.status = "approved"
            return "approved"
        return "pending"

    # ---- Percentage Rule ----
    if rule.rule_type == "percentage":
        approval_percent = (approved_count / total_steps) * 100 if total_steps > 0 else 0
        if approval_percent >= rule.percentage_value:
            expense.status = "approved"
            return "approved"
        return "pending"

    # ---- Specific Rule ----
    if rule.rule_type == "specific":
        if any(step.approver_id == rule.specific_approver_id and step.status == "approved" for step in steps):
            expense.status = "approved"
            return "approved"
        return "pending"

    # ---- Hybrid Rule ----
    if rule.rule_type == "hybrid":
        approval_percent = (approved_count / total_steps) * 100 if total_steps > 0 else 0
        specific_approved = any(
            step.approver_id == rule.specific_approver_id and step.status == "approved"
            for step in steps
        )

        if approval_percent >= rule.percentage_value or specific_approved:
            expense.status = "approved"
            return "approved"
        return "pending"

    return "pending"


def move_to_next_step_if_needed(expense: Expense, db: Session):
    """
    For sequential-style progression, update expense.current_step
    to the next pending step if expense is still pending.
    """
    if expense.status != "pending":
        return

    next_pending = db.query(ApprovalStep).filter(
        ApprovalStep.expense_id == expense.id,
        ApprovalStep.status == "pending"
    ).order_by(ApprovalStep.step_order.asc()).first()

    if next_pending:
        expense.current_step = next_pending.step_order
    else:
        expense.status = "approved"


def process_expense_action(expense_id: int, approver: User, action: str, comment: str, db: Session):
    """
    Approve or reject an expense by the current approver.
    """
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.company_id == approver.company_id
    ).first()

    if not expense:
        return None, "Expense not found"

    if expense.status != "pending":
        return None, "Expense is already closed"

    # Only current step approver can act
    current_step = db.query(ApprovalStep).filter(
        ApprovalStep.expense_id == expense.id,
        ApprovalStep.step_order == expense.current_step,
        ApprovalStep.approver_id == approver.id
    ).first()

    if not current_step:
        return None, "You are not authorized to act on this expense right now"

    if action not in ["approve", "reject"]:
        return None, "Invalid action"

    # Apply action
    current_step.status = "approved" if action == "approve" else "rejected"
    current_step.comment = comment
    current_step.action_time = datetime.utcnow()

    if action == "reject":
        expense.status = "rejected"
        db.commit()
        db.refresh(expense)
        return expense, None

    # Evaluate approval rule after approval
    evaluate_approval_rule(expense, db)

    # Move to next step if still pending
    move_to_next_step_if_needed(expense, db)

    db.commit()
    db.refresh(expense)
    return expense, None