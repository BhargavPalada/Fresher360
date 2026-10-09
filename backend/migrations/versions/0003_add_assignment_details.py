"""Migration: add comments, assessment_status, and assessment_result to task_assignments.

Revision ID: 0003
Revises: fb759721b06b
Create Date: 2026-10-08
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003"
down_revision: Union[str, None] = "fb759721b06b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "task_assignments",
        sa.Column("comments", sa.Text(), nullable=True),
    )
    op.add_column(
        "task_assignments",
        sa.Column("assessment_status", sa.String(length=50), nullable=True, server_default="Pending"),
    )
    op.add_column(
        "task_assignments",
        sa.Column("assessment_result", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("task_assignments", "assessment_result")
    op.drop_column("task_assignments", "assessment_status")
    op.drop_column("task_assignments", "comments")
