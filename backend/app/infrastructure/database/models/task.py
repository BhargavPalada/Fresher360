"""SQLAlchemy ORM models for tasks and task_assignments tables.

Infrastructure concerns only.
"""
from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus
from app.infrastructure.database.models.user import UserModel
from app.infrastructure.database.session import Base


class TaskModel(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sa.text("gen_random_uuid()"),
    )
    task_number: Mapped[int | None] = mapped_column(
        sa.Integer,
        sa.Identity(start=101, cycle=False),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(sa.String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    category: Mapped[TaskCategory] = mapped_column(
        PG_ENUM(TaskCategory, name="task_category", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    priority: Mapped[TaskPriority] = mapped_column(
        PG_ENUM(TaskPriority, name="task_priority", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    due_date: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=True,
        index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        PG_ENUM(TaskStatus, name="task_status", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=TaskStatus.PENDING,
        index=True,
    )
    comments: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(sa.String(512), nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    assignments: Mapped[list["TaskAssignmentModel"]] = relationship(
        "TaskAssignmentModel",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    created_by: Mapped[UserModel | None] = relationship(
        "UserModel",
        foreign_keys=[created_by_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<TaskModel id={self.id} number={self.task_number} title={self.title} status={self.status}>"


class TaskAssignmentModel(Base):
    __tablename__ = "task_assignments"
    __table_args__ = (
        sa.UniqueConstraint("task_id", "user_id", name="uq_task_user_assignment"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sa.text("gen_random_uuid()"),
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[TaskStatus] = mapped_column(
        PG_ENUM(TaskStatus, name="task_status", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=TaskStatus.PENDING,
        index=True,
    )
    completion_summary: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    document_url: Mapped[str | None] = mapped_column(sa.String(512), nullable=True)
    comments: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    assessment_status: Mapped[str | None] = mapped_column(
        sa.String(50),
        nullable=True,
        default="Pending",
        server_default="Pending",
    )
    assessment_result: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    # Relationships
    task: Mapped[TaskModel] = relationship(
        "TaskModel",
        back_populates="assignments",
        lazy="selectin",
    )
    user: Mapped[UserModel] = relationship(
        "UserModel",
        foreign_keys=[user_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<TaskAssignmentModel id={self.id} task_id={self.task_id} user_id={self.user_id}>"
