"""Unit tests for TaskService."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.tasks.task_service import TaskService
from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus
from app.infrastructure.database.models.task import TaskAssignmentModel, TaskModel
from app.infrastructure.database.models.user import UserModel
from app.schemas.task import CreateTaskRequest, UpdateTaskRequest


@pytest.fixture
def mock_task_repo() -> MagicMock:
    return MagicMock()


@pytest.fixture
def sample_task_model() -> TaskModel:
    user = UserModel(
        id=uuid.uuid4(),
        first_name="Jane",
        last_name="Fresher",
        email="fresher@test.com",
    )
    assignment = TaskAssignmentModel(
        id=uuid.uuid4(),
        task_id=uuid.uuid4(),
        user_id=user.id,
        status=TaskStatus.PENDING,
    )
    assignment.user = user

    task = TaskModel(
        id=uuid.uuid4(),
        task_number=101,
        title="Create API Documentation",
        description="Write OpenAPI docs for task module",
        category=TaskCategory.DOCUMENTATION,
        priority=TaskPriority.HIGH,
        due_date=datetime.now(timezone.utc),
        status=TaskStatus.PENDING,
        comments="Please finish by Friday",
        created_by_id=uuid.uuid4(),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    task.assignments = [assignment]
    return task


@pytest.mark.asyncio
async def test_create_task_success(mock_task_repo: MagicMock, sample_task_model: TaskModel):
    mock_task_repo.create_task = AsyncMock(return_value=sample_task_model)
    service = TaskService(mock_task_repo)

    req = CreateTaskRequest(
        title="Create API Documentation",
        description="Write OpenAPI docs for task module",
        category=TaskCategory.DOCUMENTATION,
        priority=TaskPriority.HIGH,
        due_date=datetime.now(timezone.utc),
        status=TaskStatus.PENDING,
        assigned_fresher_ids=[uuid.uuid4()],
        comments="Please finish by Friday",
    )

    admin_id = uuid.uuid4()
    response = await service.create_task(req, created_by_id=admin_id)

    assert response.code == "TSK-101"
    assert response.title == "Create API Documentation"
    assert response.category == "Documentation"
    assert response.priority == "High"
    assert response.status == "Pending"
    assert len(response.assigned_freshers) == 1
    assert response.assigned_freshers[0].first_name == "Jane"


@pytest.mark.asyncio
async def test_get_all_tasks_filters(mock_task_repo: MagicMock, sample_task_model: TaskModel):
    mock_task_repo.get_all_tasks = AsyncMock(return_value=[sample_task_model])
    service = TaskService(mock_task_repo)

    tasks = await service.get_all_tasks(
        search="OpenAPI",
        category=TaskCategory.DOCUMENTATION,
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
    )

    assert len(tasks) == 1
    assert tasks[0].title == "Create API Documentation"
    mock_task_repo.get_all_tasks.assert_awaited_once_with(
        search="OpenAPI",
        fresher_id=None,
        category=TaskCategory.DOCUMENTATION,
        priority=TaskPriority.HIGH,
        status=TaskStatus.PENDING,
    )


@pytest.mark.asyncio
async def test_update_assignment(mock_task_repo: MagicMock, sample_task_model: TaskModel):
    sample_task_model.assignments[0].assessment_status = "Passed"
    sample_task_model.assignments[0].assessment_result = "Score: 95/100, Excellent work"
    sample_task_model.assignments[0].comments = "Well done"
    mock_task_repo.update_assignment = AsyncMock(return_value=sample_task_model)
    service = TaskService(mock_task_repo)

    from app.schemas.task import UpdateAssignmentRequest
    req = UpdateAssignmentRequest(
        assessment_status="Passed",
        assessment_result="Score: 95/100, Excellent work",
        comments="Well done",
    )

    updated = await service.update_assignment(sample_task_model.id, sample_task_model.assignments[0].user_id, req)
    assert updated is not None
    assert updated.assigned_freshers[0].assessment_status == "Passed"
    assert updated.assigned_freshers[0].assessment_result == "Score: 95/100, Excellent work"
    assert updated.assigned_freshers[0].comments == "Well done"


@pytest.mark.asyncio
async def test_delete_task_comments(mock_task_repo: MagicMock, sample_task_model: TaskModel):
    sample_task_model.comments = None
    mock_task_repo.delete_task_comments = AsyncMock(return_value=sample_task_model)
    service = TaskService(mock_task_repo)

    res = await service.delete_task_comments(sample_task_model.id)
    assert res is not None
    assert res.comments is None


@pytest.mark.asyncio
async def test_delete_assignment_comments(mock_task_repo: MagicMock, sample_task_model: TaskModel):
    sample_task_model.assignments[0].comments = None
    mock_task_repo.delete_assignment_comments = AsyncMock(return_value=sample_task_model)
    service = TaskService(mock_task_repo)

    res = await service.delete_assignment_comments(sample_task_model.id, sample_task_model.assignments[0].user_id)
    assert res is not None
    assert res.assigned_freshers[0].comments is None

