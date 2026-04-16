from decimal import Decimal

from pydantic import BaseModel


class DashboardTotalResponse(BaseModel):
    amount: Decimal


class CurrentMonthSummaryResponse(BaseModel):
    month: int
    year: int
    income_total: Decimal
    expense_total: Decimal
    net_balance: Decimal


class CategorySpendingResponse(BaseModel):
    category_id: int | None = None
    category_name: str | None = None
    total: Decimal


class BudgetProgressResponse(BaseModel):
    budget_id: int
    category_id: int | None = None
    category_name: str | None = None
    month: int
    year: int
    budget_amount: Decimal
    spent_amount: Decimal
    remaining_amount: Decimal
    percent_used: Decimal
