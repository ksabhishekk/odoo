from sqlalchemy import Column, Integer, String, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))

    amount_original = Column(Float, nullable=False)
    currency_original = Column(String(10), nullable=False)

    amount_converted = Column(Float, nullable=False)
    currency_converted = Column(String(10), nullable=False)

    category = Column(String(100))
    description = Column(String(255))
    expense_date = Column(Date)

    status = Column(String(50), default="pending")
    current_step = Column(Integer, default=0)

    user = relationship("User")
    company = relationship("Company")