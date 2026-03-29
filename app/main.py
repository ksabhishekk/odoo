from fastapi import FastAPI
from app.database import Base, engine
import app.models   # IMPORTANT: loads all models before create_all

app = FastAPI(title="Reimbursement Management System API")

try:
    Base.metadata.create_all(bind=engine)
    print("Database connected successfully")
    print("Tables created successfully")
except Exception as e:
    print("Database connection error:", e)

@app.get("/")
def root():
    return {"message": "Backend is running"}