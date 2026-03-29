from fastapi import FastAPI
from app.database import Base, engine
import app.models
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.approval_rules import router as approval_rules_router
from app.routes.expenses import router as expenses_router

app = FastAPI(title="Reimbursement Management System API")

try:
    Base.metadata.create_all(bind=engine)
    print("Database connected successfully")
    print("Tables created successfully")
except Exception as e:
    print("Database connection error:", e)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Backend is running"}


app.include_router(users_router)
app.include_router(expenses_router)
app.include_router(approval_rules_router)