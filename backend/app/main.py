from fastapi import FastAPI

from backend.app.api.auth import router as auth_router
from backend.app.api.categories import router as categories_router
from backend.app.core.database import Base, engine
from backend.app.models.category import Category
from backend.app.models.user import User

app = FastAPI(title="MapleBudget API")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(categories_router)


@app.get("/")
def root():
    return {"message": "MapleBudget API is running"}