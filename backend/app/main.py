from fastapi import FastAPI

from backend.app.api.auth import router as auth_router
from backend.app.core.database import Base, engine
from backend.app.models.user import User

app = FastAPI(title="MapleBudget API")

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "MapleBudget API is running"}