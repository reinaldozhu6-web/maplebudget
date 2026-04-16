from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.auth import router as auth_router
from backend.app.api.budgets import router as budgets_router
from backend.app.api.categories import router as categories_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.transactions import router as transactions_router

app = FastAPI(title="MapleBudget API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(budgets_router)
app.include_router(categories_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)


@app.get("/")
def root():
    return {"message": "MapleBudget API is running"}
