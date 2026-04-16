from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    default_currency: str = "CAD"


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    default_currency: str

    class Config:
        from_attributes = True