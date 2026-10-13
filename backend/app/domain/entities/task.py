"""Task and TaskAssignment domain entities.

Pure Python dataclasses — zero framework dependencies.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus


@dataclass
class TaskAssignment:
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    status: TaskStatus
    completion_summary: str | None
    document_url: str | None
    comments: str | None = None
    assessment_status: str | None = "Pending"
    assessment_result: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def create(
        cls,
        *,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        status: TaskStatus = TaskStatus.PENDING,
        comments: str | None = None,
        assessment_status: str | None = "Pending",
        assessment_result: str | None = None,
    ) -> "TaskAssignment":
        now = datetime.now(timezone.utc)
        return cls(
            id=uuid.uuid4(),
            task_id=task_id,
            user_id=user_id,
            status=status,
            completion_summary=None,
            document_url=None,
            comments=comments,
            assessment_status=assessment_status,
            assessment_result=assessment_result,
            created_at=now,
            updated_at=now,
        )


@dataclass
class Task:
    id: uuid.UUID
    task_number: int | None
    title: str
    description: str | None
    category: TaskCategory
    priority: TaskPriority
    due_date: datetime | None
    status: TaskStatus
    comments: str | None
    created_by_id: uuid.UUID
    assignments: list[TaskAssignment] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def create(
        cls,
        *,
        title: str,
        category: TaskCategory,
        priority: TaskPriority,
        created_by_id: uuid.UUID,
        description: str | None = None,
        due_date: datetime | None = None,
        status: TaskStatus = TaskStatus.PENDING,
        comments: str | None = None,
        task_number: int | None = None,
    ) -> "Task":
        now = datetime.now(timezone.utc)
        return cls(
            id=uuid.uuid4(),
            task_number=task_number,
            title=title.strip(),
            description=description.strip() if description else None,
            category=category,
            priority=priority,
            due_date=due_date,
            status=status,
            comments=comments.strip() if comments else None,
            created_by_id=created_by_id,
            assignments=[],
            created_at=now,
            updated_at=now,
        )

    @property
    def code(self) -> str:
        """Formatted task identifier for display, e.g. TSK-101."""
        if self.task_number:
            return f"TSK-{self.task_number}"
        return f"TSK-{str(self.id)[:6].upper()}"
