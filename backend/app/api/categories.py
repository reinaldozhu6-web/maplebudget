from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.category import Category
from backend.app.models.user import User
from backend.app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    categories = (
        db.query(Category)
        .filter(Category.user_id == current_user.id)
        .order_by(Category.type, Category.name)
        .all()
    )
    return categories


@router.post("", response_model=CategoryResponse)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_category = (
        db.query(Category)
        .filter(
            Category.user_id == current_user.id,
            Category.name == category_data.name,
            Category.type == category_data.type,
        )
        .first()
    )

    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    new_category = Category(
        user_id=current_user.id,
        name=category_data.name,
        type=category_data.type,
        icon=category_data.icon,
        is_default=False,
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category