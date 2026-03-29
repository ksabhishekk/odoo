from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))

    rule_type = Column(String(50), nullable=False)
    percentage_value = Column(Float, nullable=True)
    specific_approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    company = relationship("Company")
    approvers = relationship("RuleApprover", cascade="all, delete")