"""Task repository — infrastructure implementation for task management."""
from __future__ import annotations

import logging
import uuid
from typing import Sequence

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus
from app.infrastructure.database.models.task import TaskAssignmentModel, TaskModel
from app.infrastructure.database.models.user import UserModel
from app.schemas.task import (
    CreateTaskRequest,
    UpdateTaskRequest,
    SubmitTaskRequest,
    UpdateAssignmentRequest,
)

logger = logging.getLogger(__name__)


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create_task(
        self,
        data: CreateTaskRequest,
        created_by_id: uuid.UUID,
    ) -> TaskModel:
        task = TaskModel(
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            category=data.category,
            priority=data.priority,
            due_date=data.due_date,
            status=data.status,
            comments=data.comments.strip() if data.comments else None,
            attachment_url=data.attachment_url,
            created_by_id=created_by_id,
        )
        self._session.add(task)
        await self._session.flush()

        for user_id in data.assigned_fresher_ids:
            assignment = TaskAssignmentModel(
                task_id=task.id,
                user_id=user_id,
                status=data.status,
                comments=None,
                assessment_status="Pending",
                assessment_result=None,
            )
            self._session.add(assignment)

        await self._session.commit()
        return await self.get_task_by_id(task.id)  # type: ignore[return-value]

    async def get_all_tasks(
        self,
        *,
        search: str | None = None,
        fresher_id: uuid.UUID | None = None,
        category: TaskCategory | None = None,
        priority: TaskPriority | None = None,
        status: TaskStatus | None = None,
    ) -> Sequence[TaskModel]:
        stmt = (
            select(TaskModel)
            .options(
                selectinload(TaskModel.assignments).selectinload(TaskAssignmentModel.user),
                selectinload(TaskModel.created_by),
            )
            .order_by(TaskModel.created_at.desc())
        )

        if category is not None:
            stmt = stmt.where(TaskModel.category == category)

        if priority is not None:
            stmt = stmt.where(TaskModel.priority == priority)

        if status is not None:
            stmt = stmt.where(TaskModel.status == status)

        if fresher_id is not None:
            stmt = stmt.where(
                TaskModel.assignments.any(TaskAssignmentModel.user_id == fresher_id)
            )

        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            stmt = stmt.where(
                or_(
                    TaskModel.title.ilike(term),
                    TaskModel.description.ilike(term),
                    TaskModel.comments.ilike(term),
                    TaskModel.assignments.any(
                        TaskAssignmentModel.user.has(
                            or_(
                                UserModel.first_name.ilike(term),
                                UserModel.last_name.ilike(term),
                                UserModel.email.ilike(term),
                            )
                        )
                    ),
                )
            )

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_task_by_id(self, task_id: uuid.UUID) -> TaskModel | None:
        stmt = (
            select(TaskModel)
            .where(TaskModel.id == task_id)
            .options(
                selectinload(TaskModel.assignments).selectinload(TaskAssignmentModel.user),
                selectinload(TaskModel.created_by),
            )
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_task(
        self,
        task_id: uuid.UUID,
        data: UpdateTaskRequest,
    ) -> TaskModel | None:
        task = await self.get_task_by_id(task_id)
        if not task:
            return None

        if data.title is not None:
            task.title = data.title.strip()
        if data.description is not None:
            task.description = data.description.strip() if data.description else None
        if data.category is not None:
            task.category = data.category
        if data.priority is not None:
            task.priority = data.priority
        if data.due_date is not None:
            task.due_date = data.due_date
        if data.status is not None:
            task.status = data.status
        if data.comments is not None:
            task.comments = data.comments.strip() if data.comments else None
        if data.attachment_url is not None:
            task.attachment_url = data.attachment_url

        # Synchronize assigned freshers if list provided
        if data.assigned_fresher_ids is not None:
            current_user_ids = {a.user_id for a in task.assignments}
            target_user_ids = set(data.assigned_fresher_ids)

            # Remove assignments no longer present
            for assignment in list(task.assignments):
                if assignment.user_id not in target_user_ids:
                    await self._session.delete(assignment)

            # Add new assignments
            for new_uid in target_user_ids - current_user_ids:
                new_assignment = TaskAssignmentModel(
                    task_id=task.id,
                    user_id=new_uid,
                    status=task.status,
                    comments=None,
                    assessment_status="Pending",
                    assessment_result=None,
                )
                self._session.add(new_assignment)

        await self._session.commit()
        return await self.get_task_by_id(task.id)

    async def update_assignment(
        self,
        task_id: uuid.UUID,
        user_id: uuid.UUID,
        data: UpdateAssignmentRequest,
    ) -> TaskModel | None:
        task = await self.get_task_by_id(task_id)
        if not task:
            return None

        assignment = next((a for a in task.assignments if a.user_id == user_id), None)
        if not assignment:
            return None

        if data.status is not None:
            assignment.status = data.status
        if data.comments is not None:
            assignment.comments = data.comments.strip() if data.comments.strip() else None
        if data.assessment_status is not None:
            assignment.assessment_status = data.assessment_status.strip() if data.assessment_status.strip() else None
        if data.assessment_result is not None:
            assignment.assessment_result = data.assessment_result.strip() if data.assessment_result.strip() else None

        await self._session.commit()
        return await self.get_task_by_id(task.id)

    async def delete_task_comments(self, task_id: uuid.UUID) -> TaskModel | None:
        task = await self.get_task_by_id(task_id)
        if not task:
            return None
        task.comments = None
        await self._session.commit()
        return await self.get_task_by_id(task.id)

    async def delete_assignment_comments(self, task_id: uuid.UUID, user_id: uuid.UUID) -> TaskModel | None:
        task = await self.get_task_by_id(task_id)
        if not task:
            return None
        assignment = next((a for a in task.assignments if a.user_id == user_id), None)
        if not assignment:
            return None
        assignment.comments = None
        await self._session.commit()
        return await self.get_task_by_id(task.id)

    async def delete_task(self, task_id: uuid.UUID) -> bool:
        task = await self.get_task_by_id(task_id)
        if not task:
            return False
        await self._session.delete(task)
        await self._session.commit()
        logger.info("task.deleted", extra={"task_id": str(task_id)})
        return True

    async def submit_task(self, task_id: uuid.UUID, user_id: uuid.UUID, data: SubmitTaskRequest) -> TaskModel | None:
        task = await self.get_task_by_id(task_id)
        if not task:
            return None

        # Find the specific assignment
        assignment = next((a for a in task.assignments if a.user_id == user_id), None)
        if not assignment:
            return None

        if data.completion_summary is not None:
            assignment.completion_summary = data.completion_summary.strip() if data.completion_summary else None
        if data.document_url is not None:
            assignment.document_url = data.document_url
        if data.comments is not None:
            assignment.comments = data.comments.strip() if data.comments else None

        assignment.status = TaskStatus.COMPLETED
        assignment.assessment_status = "Under Review"

        await self._session.commit()
        return await self.get_task_by_id(task.id)
