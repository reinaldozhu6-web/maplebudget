from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.transaction import Transaction
from backend.app.models.user import User
from backend.app.schemas.dashboard import (
    BudgetProgressResponse,
    CategorySpendingResponse,
    CurrentMonthSummaryResponse,
    DashboardTotalResponse,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def current_month_range() -> tuple[date, date]:
    today = date.today()
    start_date = date(today.year, today.month, 1)
    if today.month == 12:
        end_date = date(today.year + 1, 1, 1)
    else:
        end_date = date(today.year, today.month + 1, 1)
    return start_date, end_date


def current_month_transactions(db: Session, current_user: User) -> list[Transaction]:
    start_date, end_date = current_month_range()
    return (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start_date,
            Transaction.date < end_date,
        )
        .all()
    )


def transaction_total(
    transactions: list[Transaction],
    transaction_type: str,
) -> Decimal:
    total = Decimal("0")
    for transaction in transactions:
        if transaction.type == transaction_type:
            total += transaction.amount
    return total


def category_names(db: Session, current_user: User) -> dict[int, str]:
    categories = db.query(Category).filter(Category.user_id == current_user.id).all()
    return {category.id: category.name for category in categories}


@router.get("/current-month-summary", response_model=CurrentMonthSummaryResponse)
def get_current_month_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, _ = current_month_range()
    transactions = current_month_transactions(db, current_user)
    income_total = transaction_total(transactions, "income")
    expense_total = transaction_total(transactions, "expense")

    return CurrentMonthSummaryResponse(
        month=start_date.month,
        year=start_date.year,
        income_total=income_total,
        expense_total=expense_total,
        net_balance=income_total - expense_total,
    )


@router.get("/current-month-income", response_model=DashboardTotalResponse)
def get_current_month_income(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = current_month_transactions(db, current_user)
    return DashboardTotalResponse(amount=transaction_total(transactions, "income"))


@router.get("/current-month-expenses", response_model=DashboardTotalResponse)
def get_current_month_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = current_month_transactions(db, current_user)
    return DashboardTotalResponse(amount=transaction_total(transactions, "expense"))


@router.get("/current-month-net-balance", response_model=DashboardTotalResponse)
def get_current_month_net_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = current_month_transactions(db, current_user)
    income_total = transaction_total(transactions, "income")
    expense_total = transaction_total(transactions, "expense")
    return DashboardTotalResponse(amount=income_total - expense_total)


@router.get(
    "/current-month-spending-by-category",
    response_model=list[CategorySpendingResponse],
)
def get_current_month_spending_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transactions = current_month_transactions(db, current_user)
    names_by_id = category_names(db, current_user)
    totals_by_category: dict[int | None, Decimal] = {}

    for transaction in transactions:
        if transaction.type != "expense":
            continue
        totals_by_category[transaction.category_id] = (
            totals_by_category.get(transaction.category_id, Decimal("0"))
            + transaction.amount
        )

    return [
        CategorySpendingResponse(
            category_id=category_id,
            category_name=names_by_id.get(category_id) if category_id else None,
            total=total,
        )
        for category_id, total in sorted(
            totals_by_category.items(),
            key=lambda item: (item[0] is None, item[0] or 0),
        )
    ]


@router.get("/current-month-budget-progress", response_model=list[BudgetProgressResponse])
def get_current_month_budget_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, _ = current_month_range()
    transactions = current_month_transactions(db, current_user)
    names_by_id = category_names(db, current_user)
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == start_date.month,
            Budget.year == start_date.year,
        )
        .order_by(Budget.id)
        .all()
    )

    progress = []
    for budget in budgets:
        spent_amount = Decimal("0")
        for transaction in transactions:
            if transaction.type != "expense":
                continue
            if budget.category_id is not None and transaction.category_id != budget.category_id:
                continue
            spent_amount += transaction.amount

        percent_used = Decimal("0")
        if budget.amount > 0:
            percent_used = (spent_amount / budget.amount * Decimal("100")).quantize(
                Decimal("0.01")
            )

        progress.append(
            BudgetProgressResponse(
                budget_id=budget.id,
                category_id=budget.category_id,
                category_name=names_by_id.get(budget.category_id)
                if budget.category_id
                else None,
                month=budget.month,
                year=budget.year,
                budget_amount=budget.amount,
                spent_amount=spent_amount,
                remaining_amount=budget.amount - spent_amount,
                percent_used=percent_used,
            )
        )

    return progress
