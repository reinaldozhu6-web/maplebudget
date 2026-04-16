from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MapleBudget API"
    database_url: str = "sqlite:///./maplebudget.db"
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = "backend/.env"


settings = Settings()