from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True, index=True)

    expense_id = Column(Integer, ForeignKey("expenses.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))

    step_order = Column(Integer, nullable=False)

    status = Column(String(50), default="pending")  # pending / approved / rejected
    comment = Column(String(255), nullable=True)

    action_time = Column(DateTime, nullable=True)

    expense = relationship("Expense")
    approver = relationship("User")