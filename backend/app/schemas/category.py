from typing import Literal

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    type: Literal["income", "expense"]
    icon: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    type: str
    icon: str | None = None
    is_default: bool

    class Config:
        from_attributes = True