from fastapi import FastAPI
from app.database import Base, engine

app = FastAPI(title="Reimbursement Management System API")

# Create tables
Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Backend is running"}