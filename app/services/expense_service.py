from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.user import User
from app.models.approval_step import ApprovalStep
from app.schemas.expense import ExpenseCreateRequest
from app.services.currency_service import convert_currency
from app.services.approval_engine import generate_approval_steps, process_expense_action

def create_expense(data: ExpenseCreateRequest, current_user: User, db: Session):
    converted_amount = convert_currency(
        amount=data.amount_original,
        from_currency=data.currency_original,
        to_currency=current_user.company.default_currency
    )

    expense = Expense(
        user_id=current_user.id,
        company_id=current_user.company_id,
        amount_original=data.amount_original,
        currency_original=data.currency_original,
        amount_converted=converted_amount,
        currency_converted=current_user.company.default_currency,
        category=data.category,
        description=data.description,
        expense_date=data.expense_date,
        status="pending",
        current_step=1
    )

    db.add(expense)
    db.flush()

    generate_approval_steps(expense, current_user, db)

    db.commit()
    db.refresh(expense)

    return expense

def get_expenses_for_user(current_user: User, db: Session):
    if current_user.role == "admin":
        return db.query(Expense).filter(
            Expense.company_id == current_user.company_id
        ).all()

    elif current_user.role == "manager":
        team_user_ids = db.query(User.id).filter(
            User.manager_id == current_user.id,
            User.company_id == current_user.company_id
        ).all()

        team_user_ids = [u[0] for u in team_user_ids]
        team_user_ids.append(current_user.id)

        return db.query(Expense).filter(
            Expense.company_id == current_user.company_id,
            Expense.user_id.in_(team_user_ids)
        ).all()

    else:
        return db.query(Expense).filter(
            Expense.user_id == current_user.id
        ).all()

def get_expense_detail(expense_id: int, current_user: User, db: Session):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.company_id == current_user.company_id
    ).first()

    if not expense:
        return None

    if current_user.role == "employee" and expense.user_id != current_user.id:
        return None

    return expense

def act_on_expense(expense_id: int, current_user: User, action: str, comment: str, db: Session):
    return process_expense_action(expense_id, current_user, action, comment, db)

from app.models.approval_step import ApprovalStep  # add this at top if not already imported

def get_pending_approvals(current_user: User, db: Session):
    """
    Returns only expenses currently waiting for this user's approval.
    """
    pending_expenses = db.query(Expense).join(ApprovalStep).filter(
        Expense.company_id == current_user.company_id,
        Expense.status == "pending",
        ApprovalStep.expense_id == Expense.id,
        ApprovalStep.approver_id == current_user.id,
        ApprovalStep.step_order == Expense.current_step,
        ApprovalStep.status == "pending"
    ).all()

    return pending_expenses