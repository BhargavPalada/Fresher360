"""Unit tests for Dashboard API."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.api.v1.dashboard import get_dashboard_stats
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.schemas.task import AssignedFresherResponse, TaskResponse


@pytest.fixture
def admin_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="admin@fresher360.com",
        password_hash="argon2id$mock",
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.fixture
def fresher_user() -> User:
    return User(
        id=uuid.uuid4(),
        email="fresher@fresher360.com",
        password_hash="argon2id$mock",
        first_name="Jane",
        last_name="Fresher",
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_get_dashboard_stats_admin(admin_user: User, fresher_user: User):
    mock_task_service = MagicMock()
    mock_user_repo = MagicMock()

    mock_user_repo.get_all = AsyncMock(return_value=[admin_user, fresher_user])

    sample_task = TaskResponse(
        id=str(uuid.uuid4()),
        code="TSK-101",
        title="Sample Task",
        description="Testing dashboard",
        category="Technical",
        priority="High",
        due_date=None,
        status="In Progress",
        comments=None,
        attachment_url=None,
        assigned_freshers=[
            AssignedFresherResponse(
                id=str(fresher_user.id),
                first_name="Jane",
                last_name="Fresher",
                email="fresher@fresher360.com",
                status="In Progress",
                assessment_status="Pending",
                assessment_result="85",
            )
        ],
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    mock_task_service.get_all_tasks = AsyncMock(return_value=[sample_task])

    response = await get_dashboard_stats(
        current_user=admin_user,
        task_service=mock_task_service,
        user_repo=mock_user_repo,
    )

    data = response.data
    assert data["role"] == "ADMIN"
    assert data["total_users"] == 2
    assert data["total_freshers"] == 1
    assert data["total_tasks"] == 1
    assert data["active_tasks"] == 1
    assert data["average_score"] == 85.0
    assert data["category_counts"]["Technical"] == 1


@pytest.mark.asyncio
async def test_get_dashboard_stats_fresher(fresher_user: User):
    mock_task_service = MagicMock()
    mock_user_repo = MagicMock()

    sample_task = TaskResponse(
        id=str(uuid.uuid4()),
        code="TSK-101",
        title="Fresher Task",
        description="Testing fresher stats",
        category="Training",
        priority="Medium",
        due_date=None,
        status="Completed",
        comments=None,
        attachment_url=None,
        assigned_freshers=[
            AssignedFresherResponse(
                id=str(fresher_user.id),
                first_name="Jane",
                last_name="Fresher",
                email="fresher@fresher360.com",
                status="Completed",
                assessment_status="Passed",
                assessment_result="92",
            )
        ],
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )
    mock_task_service.get_all_tasks = AsyncMock(return_value=[sample_task])

    response = await get_dashboard_stats(
        current_user=fresher_user,
        task_service=mock_task_service,
        user_repo=mock_user_repo,
    )

    data = response.data
    assert data["role"] == "USER"
    assert data["total_assigned"] == 1
    assert data["completed_tasks"] == 1
    assert data["completion_rate"] == 100.0
    assert data["average_score"] == 92.0
    assert data["passed_count"] == 1
