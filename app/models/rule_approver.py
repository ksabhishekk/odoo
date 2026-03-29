from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class RuleApprover(Base):
    __tablename__ = "rule_approvers"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(Integer, ForeignKey("approval_rules.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    sequence = Column(Integer, nullable=False)

    rule = relationship("ApprovalRule")
    user = relationship("User")