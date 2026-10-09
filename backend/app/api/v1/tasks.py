"""Tasks API — task assignment and management endpoints.

Endpoints:
- POST   /api/v1/tasks                                     (Admin only — create and assign task)
- GET    /api/v1/tasks                                     (Admin / Freshers — list tasks with search & filters)
- GET    /api/v1/tasks/{task_id}                           (Authenticated user — view task details)
- PUT    /api/v1/tasks/{task_id}                           (Admin only — full edit of task details & freshers)
- DELETE /api/v1/tasks/{task_id}                           (Admin only — delete task)
- POST   /api/v1/tasks/{task_id}/submit                    (Fresher only — submit completed work)
- PATCH  /api/v1/tasks/{task_id}/assignments/{user_id}     (Admin only — update user assignment, assessment, comments)
- DELETE /api/v1/tasks/{task_id}/assignments/{user_id}/comments (Admin only — delete assignment comment)
- DELETE /api/v1/tasks/{task_id}/comments                  (Admin only — delete task comment)
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.tasks.task_service import TaskService
from app.dependencies import (
    get_task_service,
    require_admin,
    require_authenticated_user,
)
from app.domain.entities.user import User
from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus
from app.schemas.auth import ApiResponse
from app.schemas.task import (
    CreateTaskRequest,
    UpdateTaskRequest,
    SubmitTaskRequest,
    UpdateAssignmentRequest,
)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: CreateTaskRequest,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Create and assign a task to one or more freshers."""
    task = await task_service.create_task(body, created_by_id=current_user.id)
    return ApiResponse.success(task.model_dump())


@router.get("", response_model=ApiResponse)
async def list_all_tasks(
    search: str | None = Query(default=None, description="Search by title, description, or fresher"),
    fresher_id: uuid.UUID | None = Query(default=None, description="Filter by assigned fresher"),
    category: TaskCategory | None = Query(default=None, description="Filter by category"),
    priority: TaskPriority | None = Query(default=None, description="Filter by priority"),
    task_status: TaskStatus | None = Query(default=None, alias="status", description="Filter by status"),
    current_user: User = Depends(require_authenticated_user),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """View tasks. Admins see all tasks; freshers see only their assigned tasks."""
    if not current_user.is_admin():
        fresher_id = current_user.id

    tasks = await task_service.get_all_tasks(
        search=search,
        fresher_id=fresher_id,
        category=category,
        priority=priority,
        status=task_status,
    )
    return ApiResponse.success([t.model_dump() for t in tasks])


@router.get("/{task_id}", response_model=ApiResponse)
async def get_task_details(
    task_id: uuid.UUID,
    current_user: User = Depends(require_authenticated_user),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """View task details. Admins can view any task; freshers can view only assigned tasks."""
    task = await task_service.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found."},
        )

    # If user is not admin, verify they are assigned to this task
    if not current_user.is_admin():
        assigned_user_ids = [f.id for f in task.assigned_freshers]
        if str(current_user.id) not in assigned_user_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "FORBIDDEN", "message": "You do not have permission to view this task."},
            )

    return ApiResponse.success(task.model_dump())


@router.put("/{task_id}", response_model=ApiResponse)
async def update_task(
    task_id: uuid.UUID,
    body: UpdateTaskRequest,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Full control over task details (title, description, category, priority, due date, status, assigned freshers, comments)."""
    updated_task = await task_service.update_task(task_id, body)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found."},
        )
    return ApiResponse.success(updated_task.model_dump())


@router.delete("/{task_id}", response_model=ApiResponse)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Delete task."""
    deleted = await task_service.delete_task(task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found."},
        )
    return ApiResponse.success({"message": "Task deleted successfully"})


@router.delete("/{task_id}/comments", response_model=ApiResponse)
async def delete_task_comments(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Delete comments from task."""
    updated = await task_service.delete_task_comments(task_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found."},
        )
    return ApiResponse.success(updated.model_dump())


@router.patch("/{task_id}/assignments/{user_id}", response_model=ApiResponse)
async def update_assignment(
    task_id: uuid.UUID,
    user_id: uuid.UUID,
    body: UpdateAssignmentRequest,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Maintain independent assignment status, comments, assessment status, and assessment result."""
    updated = await task_service.update_assignment(task_id, user_id, body)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Task or assignment not found."},
        )
    return ApiResponse.success(updated.model_dump())


@router.delete("/{task_id}/assignments/{user_id}/comments", response_model=ApiResponse)
async def delete_assignment_comments(
    task_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Admin-only: Delete comments on specific user assignment."""
    updated = await task_service.delete_assignment_comments(task_id, user_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Task or assignment not found."},
        )
    return ApiResponse.success(updated.model_dump())


@router.post("/{task_id}/submit", response_model=ApiResponse)
async def submit_task(
    task_id: uuid.UUID,
    body: SubmitTaskRequest,
    current_user: User = Depends(require_authenticated_user),
    task_service: TaskService = Depends(get_task_service),
) -> ApiResponse:
    """Fresher-only: Submit completed work for a task."""
    updated_task = await task_service.submit_task(task_id, current_user.id, body)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task or assignment not found."},
        )
    return ApiResponse.success(updated_task.model_dump())
