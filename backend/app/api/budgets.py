from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate

router = APIRouter(prefix="/budgets", tags=["budgets"])


def get_user_budget(
    budget_id: int,
    current_user: User,
    db: Session,
) -> Budget:
    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id,
        )
        .first()
    )

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    return budget


def validate_category(
    category_id: int | None,
    current_user: User,
    db: Session,
) -> None:
    if category_id is None:
        return

    category = (
        db.query(Category)
        .filter(
            Category.id == category_id,
            Category.user_id == current_user.id,
        )
        .first()
    )

    if not category:
        raise HTTPException(status_code=400, detail="Invalid category")


def duplicate_budget_exists(
    db: Session,
    current_user: User,
    month: int,
    year: int,
    category_id: int | None,
    exclude_budget_id: int | None = None,
) -> bool:
    query = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month,
        Budget.year == year,
    )

    if category_id is None:
        query = query.filter(Budget.category_id.is_(None))
    else:
        query = query.filter(Budget.category_id == category_id)

    if exclude_budget_id is not None:
        query = query.filter(Budget.id != exclude_budget_id)

    return query.first() is not None


def validate_unique_budget(
    db: Session,
    current_user: User,
    month: int,
    year: int,
    category_id: int | None,
    exclude_budget_id: int | None = None,
) -> None:
    if duplicate_budget_exists(
        db,
        current_user,
        month,
        year,
        category_id,
        exclude_budget_id,
    ):
        raise HTTPException(status_code=400, detail="Budget already exists")


@router.get("", response_model=list[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.id.desc())
        .all()
    )


@router.post("", response_model=BudgetResponse)
def create_budget(
    budget_data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_category(budget_data.category_id, current_user, db)
    validate_unique_budget(
        db,
        current_user,
        budget_data.month,
        budget_data.year,
        budget_data.category_id,
    )

    budget = Budget(
        user_id=current_user.id,
        amount=budget_data.amount,
        month=budget_data.month,
        year=budget_data.year,
        category_id=budget_data.category_id,
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_budget(budget_id, current_user, db)


@router.patch("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = get_user_budget(budget_id, current_user, db)
    update_data = budget_data.model_dump(exclude_unset=True)

    if "category_id" in update_data:
        validate_category(update_data["category_id"], current_user, db)

    month = update_data.get("month", budget.month)
    year = update_data.get("year", budget.year)
    category_id = update_data.get("category_id", budget.category_id)
    validate_unique_budget(
        db,
        current_user,
        month,
        year,
        category_id,
        exclude_budget_id=budget.id,
    )

    for field, value in update_data.items():
        setattr(budget, field, value)

    db.commit()
    db.refresh(budget)

    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = get_user_budget(budget_id, current_user, db)

    db.delete(budget)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
