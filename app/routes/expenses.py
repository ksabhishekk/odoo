from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi import UploadFile, File
import os
from app.services.ocr_service import extract_receipt_data

from app.schemas.expense import ExpenseCreateRequest, ExpenseResponse, ExpenseActionRequest
from app.services.expense_service import (
    create_expense,
    get_expenses_for_user,
    get_expense_detail,
    act_on_expense,
    get_pending_approvals
)
from app.utils.dependencies import get_db, get_current_user, require_employee, require_manager

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("", response_model=ExpenseResponse)
def submit_expense(
    data: ExpenseCreateRequest,
    current_user = Depends(require_employee),
    db: Session = Depends(get_db)
):
    return create_expense(data, current_user, db)

@router.get("/pending-approvals", response_model=list[ExpenseResponse])
def pending_approvals(
    current_user = Depends(require_manager),
    db: Session = Depends(get_db)
):
    return get_pending_approvals(current_user, db)

@router.get("", response_model=list[ExpenseResponse])
def get_expenses(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_expenses_for_user(current_user, db)

@router.post("/parse-receipt")
def parse_receipt(file: UploadFile = File(...)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return extract_receipt_data(file_path)
@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = get_expense_detail(expense_id, current_user, db)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("/{expense_id}/action", response_model=ExpenseResponse)
def expense_action(
    expense_id: int,
    data: ExpenseActionRequest,
    current_user = Depends(require_manager),
    db: Session = Depends(get_db)
):
    expense, error = act_on_expense(
        expense_id=expense_id,
        current_user=current_user,
        action=data.action,
        comment=data.comment,
        db=db
    )

    if error:
        raise HTTPException(status_code=400, detail=error)

    return expense