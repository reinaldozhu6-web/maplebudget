from __future__ import annotations

from datetime import date as DateType
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    type: Literal["income", "expense"]
    note: str | None = None
    date: DateType
    category_id: int | None = None


class TransactionUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0)
    type: Literal["income", "expense"] | None = None
    note: str | None = None
    date: DateType | None = None
    category_id: int | None = None


class TransactionResponse(BaseModel):
    id: int
    amount: Decimal
    type: str
    note: str | None = None
    date: DateType
    category_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True
