"""Migration: create tasks, task_assignments tables and related enums.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-25
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, UUID

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create PostgreSQL ENUM types idempotently
    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category') THEN
                    CREATE TYPE task_category AS ENUM ('Documentation', 'Technical', 'Training', 'Functional');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
                    CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
                    CREATE TYPE task_status AS ENUM ('Pending', 'In Progress', 'Completed');
                END IF;
            END$$;
            """
        )
    )

    # 2. Create tasks table
    op.create_table(
        "tasks",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "task_number",
            sa.Integer(),
            sa.Identity(start=101, cycle=False),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category",
            PG_ENUM("Documentation", "Technical", "Training", "Functional", name="task_category", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "priority",
            PG_ENUM("Low", "Medium", "High", name="task_priority", create_type=False),
            nullable=False,
        ),
        sa.Column("due_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "status",
            PG_ENUM("Pending", "In Progress", "Completed", name="task_status", create_type=False),
            nullable=False,
            server_default="Pending",
        ),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column(
            "created_by_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index("ix_tasks_task_number", "tasks", ["task_number"])
    op.create_index("ix_tasks_title", "tasks", ["title"])
    op.create_index("ix_tasks_category", "tasks", ["category"])
    op.create_index("ix_tasks_priority", "tasks", ["priority"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_due_date", "tasks", ["due_date"])
    op.create_index("ix_tasks_created_at", "tasks", ["created_at"])

    # 3. Create task_assignments table
    op.create_table(
        "task_assignments",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "task_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            PG_ENUM("Pending", "In Progress", "Completed", name="task_status", create_type=False),
            nullable=False,
            server_default="Pending",
        ),
        sa.Column("completion_summary", sa.Text(), nullable=True),
        sa.Column("document_url", sa.String(512), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_unique_constraint(
        "uq_task_user_assignment", "task_assignments", ["task_id", "user_id"]
    )
    op.create_index("ix_task_assignments_task_id", "task_assignments", ["task_id"])
    op.create_index("ix_task_assignments_user_id", "task_assignments", ["user_id"])
    op.create_index("ix_task_assignments_status", "task_assignments", ["status"])


def downgrade() -> None:
    op.drop_table("task_assignments")
    op.drop_table("tasks")

    op.execute(
        sa.text(
            """
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
                    DROP TYPE task_status;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
                    DROP TYPE task_priority;
                END IF;
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_category') THEN
                    DROP TYPE task_category;
                END IF;
            END$$;
            """
        )
    )
