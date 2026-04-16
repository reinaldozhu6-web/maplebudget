from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=1900, le=9999)
    category_id: int | None = None


class BudgetUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    month: int | None = Field(default=None, ge=1, le=12)
    year: int | None = Field(default=None, ge=1900, le=9999)
    category_id: int | None = None


class BudgetResponse(BaseModel):
    id: int
    amount: Decimal
    month: int
    year: int
    category_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True
