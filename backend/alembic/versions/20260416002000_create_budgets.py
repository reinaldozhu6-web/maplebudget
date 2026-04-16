"""create budgets

Revision ID: 20260416002000
Revises: 20260416001000
Create Date: 2026-04-16 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260416002000"
down_revision: Union[str, Sequence[str], None] = "20260416001000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_budgets_category_id"), "budgets", ["category_id"], unique=False)
    op.create_index(op.f("ix_budgets_id"), "budgets", ["id"], unique=False)
    op.create_index(op.f("ix_budgets_month"), "budgets", ["month"], unique=False)
    op.create_index(op.f("ix_budgets_user_id"), "budgets", ["user_id"], unique=False)
    op.create_index(op.f("ix_budgets_year"), "budgets", ["year"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_budgets_year"), table_name="budgets")
    op.drop_index(op.f("ix_budgets_user_id"), table_name="budgets")
    op.drop_index(op.f("ix_budgets_month"), table_name="budgets")
    op.drop_index(op.f("ix_budgets_id"), table_name="budgets")
    op.drop_index(op.f("ix_budgets_category_id"), table_name="budgets")
    op.drop_table("budgets")
