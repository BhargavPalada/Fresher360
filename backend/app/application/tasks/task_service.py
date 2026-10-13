"""Task application service — coordinates task operations and formatting."""
from __future__ import annotations

import logging
import uuid
from typing import Sequence

from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus
from app.infrastructure.database.models.task import TaskModel
from app.infrastructure.database.repositories.task_repository import TaskRepository
from app.schemas.task import (
    AssignedFresherResponse,
    CreateTaskRequest,
    TaskResponse,
    UpdateTaskRequest,
    SubmitTaskRequest,
    UpdateAssignmentRequest,
)

logger = logging.getLogger(__name__)


def map_task_to_response(model: TaskModel) -> TaskResponse:
    code = f"TSK-{model.task_number}" if model.task_number else f"TSK-{str(model.id)[:6].upper()}"

    assigned_freshers = [
        AssignedFresherResponse(
            id=str(a.user.id),
            first_name=a.user.first_name,
            last_name=a.user.last_name,
            email=a.user.email,
            status=a.status.value if hasattr(a.status, "value") else str(a.status),
            completion_summary=a.completion_summary,
            document_url=a.document_url,
            comments=getattr(a, "comments", None),
            assessment_status=getattr(a, "assessment_status", "Pending") or "Pending",
            assessment_result=getattr(a, "assessment_result", None),
        )
        for a in model.assignments
        if a.user is not None
    ]

    return TaskResponse(
        id=str(model.id),
        code=code,
        title=model.title,
        description=model.description,
        category=model.category.value if hasattr(model.category, "value") else str(model.category),
        priority=model.priority.value if hasattr(model.priority, "value") else str(model.priority),
        due_date=model.due_date.isoformat() if model.due_date else None,
        status=model.status.value if hasattr(model.status, "value") else str(model.status),
        comments=model.comments,
        attachment_url=model.attachment_url,
        assigned_freshers=assigned_freshers,
        created_at=model.created_at.isoformat() if model.created_at else "",
        updated_at=model.updated_at.isoformat() if model.updated_at else "",
    )


class TaskService:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._task_repo = task_repo

    async def create_task(
        self,
        data: CreateTaskRequest,
        created_by_id: uuid.UUID,
    ) -> TaskResponse:
        model = await self._task_repo.create_task(data, created_by_id)
        return map_task_to_response(model)

    async def get_all_tasks(
        self,
        *,
        search: str | None = None,
        fresher_id: uuid.UUID | None = None,
        category: TaskCategory | None = None,
        priority: TaskPriority | None = None,
        status: TaskStatus | None = None,
    ) -> list[TaskResponse]:
        models = await self._task_repo.get_all_tasks(
            search=search,
            fresher_id=fresher_id,
            category=category,
            priority=priority,
            status=status,
        )
        return [map_task_to_response(m) for m in models]

    async def get_task_by_id(self, task_id: uuid.UUID) -> TaskResponse | None:
        model = await self._task_repo.get_task_by_id(task_id)
        return map_task_to_response(model) if model else None

    async def update_task(
        self,
        task_id: uuid.UUID,
        data: UpdateTaskRequest,
    ) -> TaskResponse | None:
        model = await self._task_repo.update_task(task_id, data)
        return map_task_to_response(model) if model else None

    async def update_assignment(
        self,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        data: UpdateAssignmentRequest,
    ) -> TaskResponse | None:
        model = await self._task_repo.update_assignment(task_id, user_id, data)
        return map_task_to_response(model) if model else None

    async def delete_task_comments(self, task_id: uuid.UUID) -> TaskResponse | None:
        model = await self._task_repo.delete_task_comments(task_id)
        return map_task_to_response(model) if model else None

    async def delete_assignment_comments(self, task_id: uuid.UUID, user_id: uuid.UUID) -> TaskResponse | None:
        model = await self._task_repo.delete_assignment_comments(task_id, user_id)
        return map_task_to_response(model) if model else None

    async def delete_task(self, task_id: uuid.UUID) -> bool:
        return await self._task_repo.delete_task(task_id)

    async def submit_task(self, task_id: uuid.UUID, user_id: uuid.UUID, data: SubmitTaskRequest) -> TaskResponse | None:
        model = await self._task_repo.submit_task(task_id, user_id, data)
        return map_task_to_response(model) if model else None
