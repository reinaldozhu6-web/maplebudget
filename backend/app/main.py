from fastapi import FastAPI

from backend.app.api.auth import router as auth_router
from backend.app.api.categories import router as categories_router

app = FastAPI(title="MapleBudget API")

app.include_router(auth_router)
app.include_router(categories_router)


@app.get("/")
def root():
    return {"message": "MapleBudget API is running"}
