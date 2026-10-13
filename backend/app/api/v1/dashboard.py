"""Dashboard API — platform and fresher aggregate metrics.

Endpoints:
- GET /api/v1/dashboard/stats (Authenticated user — dynamic statistics from database)
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends

from app.application.tasks.task_service import TaskService
from app.dependencies import (
    get_task_service,
    get_user_repository,
    require_authenticated_user,
)
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.schemas.auth import ApiResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _is_numeric(val: Any) -> bool:
    if val is None:
        return False
    try:
        float(str(val).strip())
        return True
    except (ValueError, TypeError):
        return False


@router.get("/stats", response_model=ApiResponse)
async def get_dashboard_stats(
    current_user: User = Depends(require_authenticated_user),
    task_service: TaskService = Depends(get_task_service),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApiResponse:
    """Return live dashboard statistics computed from database entities.

    Admins receive platform-wide metrics, breakdowns, recent users, and recent tasks.
    Freshers receive personalized metrics, completion rate, average score, and active tasks.
    """
    if current_user.is_admin():
        users = await user_repo.get_all()
        tasks = await task_service.get_all_tasks()

        freshers = [u for u in users if u.role == UserRole.USER]
        active_freshers = [u for u in freshers if u.is_active]
        admins = [u for u in users if u.role == UserRole.ADMIN]

        total_tasks = len(tasks)
        completed_tasks = [t for t in tasks if (t.status or "").lower() == "completed"]
        active_tasks = [t for t in tasks if (t.status or "").lower() != "completed"]
        in_progress_tasks = [t for t in tasks if (t.status or "").lower() == "in progress"]
        pending_tasks = [t for t in tasks if (t.status or "").lower() == "pending"]

        all_assignments = [a for t in tasks for a in t.assigned_freshers]
        completed_assignments = [
            a for a in all_assignments if (a.status or "").lower() == "completed"
        ]

        if all_assignments:
            completion_rate = round(
                (len(completed_assignments) / len(all_assignments)) * 100, 1
            )
        elif total_tasks:
            completion_rate = round(
                (len(completed_tasks) / total_tasks) * 100, 1
            )
        else:
            completion_rate = 0.0

        graded_assignments = [
            a
            for a in all_assignments
            if a.assessment_result and _is_numeric(a.assessment_result)
        ]
        average_score = (
            round(
                sum(float(a.assessment_result) for a in graded_assignments)
                / len(graded_assignments),
                1,
            )
            if graded_assignments
            else None
        )
        passed_count = sum(
            1 for a in all_assignments if (a.assessment_status or "").lower() == "passed"
        )
        pending_evaluations = sum(
            1
            for a in all_assignments
            if (a.status or "").lower() == "in review"
            or (
                (a.status or "").lower() == "completed"
                and (a.assessment_status or "").lower() == "pending"
            )
        )

        category_counts: dict[str, int] = {}
        priority_counts: dict[str, int] = {}
        status_counts: dict[str, int] = {}

        for t in tasks:
            cat = t.category or "Other"
            prio = t.priority or "Medium"
            st = t.status or "Pending"
            category_counts[cat] = category_counts.get(cat, 0) + 1
            priority_counts[prio] = priority_counts.get(prio, 0) + 1
            status_counts[st] = status_counts.get(st, 0) + 1

        recent_users = [
            {
                "id": str(u.id),
                "name": u.full_name(),
                "email": u.email,
                "role": u.role.value,
                "is_active": u.is_active,
            }
            for u in users[:5]
        ]
        recent_tasks = [t.model_dump() for t in tasks[:5]]

        return ApiResponse.success(
            {
                "role": "ADMIN",
                "total_users": len(users),
                "total_freshers": len(freshers),
                "active_freshers": len(active_freshers),
                "total_admins": len(admins),
                "total_tasks": total_tasks,
                "active_tasks": len(active_tasks),
                "completed_tasks": len(completed_tasks),
                "in_progress_tasks": len(in_progress_tasks),
                "pending_tasks": len(pending_tasks),
                "total_assignments": len(all_assignments),
                "completed_assignments": len(completed_assignments),
                "completion_rate": completion_rate,
                "average_score": average_score,
                "passed_count": passed_count,
                "pending_evaluations": pending_evaluations,
                "category_counts": category_counts,
                "priority_counts": priority_counts,
                "status_counts": status_counts,
                "recent_users": recent_users,
                "recent_tasks": recent_tasks,
            }
        )

    # ── Fresher / User perspective ──
    user_id_str = str(current_user.id)
    my_tasks = await task_service.get_all_tasks(fresher_id=current_user.id)

    def _get_assignment(t: Any) -> Any:
        for a in t.assigned_freshers:
            if a.id == user_id_str:
                return a
        return None

    def _get_status(t: Any) -> str:
        assgn = _get_assignment(t)
        if assgn and assgn.status:
            return assgn.status.lower()
        return (t.status or "Pending").lower()

    total_assigned = len(my_tasks)
    completed_tasks = [t for t in my_tasks if _get_status(t) == "completed"]
    in_progress_tasks = [t for t in my_tasks if _get_status(t) == "in progress"]
    pending_tasks = [t for t in my_tasks if _get_status(t) == "pending"]
    in_review_tasks = [
        t
        for t in my_tasks
        if _get_status(t) == "in review"
        or (
            _get_status(t) == "completed"
            and _get_assignment(t)
            and (_get_assignment(t).assessment_status or "").lower() == "pending"
        )
    ]

    completion_rate = (
        round((len(completed_tasks) / total_assigned) * 100, 1)
        if total_assigned
        else 0.0
    )

    my_evals = [a for t in my_tasks if (a := _get_assignment(t)) is not None]
    graded_evals = [
        a
        for a in my_evals
        if a.assessment_result and _is_numeric(a.assessment_result)
    ]
    average_score = (
        round(
            sum(float(a.assessment_result) for a in graded_evals)
            / len(graded_evals),
            1,
        )
        if graded_evals
        else None
    )
    passed_count = sum(
        1 for a in my_evals if (a.assessment_status or "").lower() == "passed"
    )

    recent_tasks = [t.model_dump() for t in my_tasks[:5]]

    return ApiResponse.success(
        {
            "role": "USER",
            "total_assigned": total_assigned,
            "completed_tasks": len(completed_tasks),
            "in_progress_tasks": len(in_progress_tasks),
            "pending_tasks": len(pending_tasks),
            "in_review_tasks": len(in_review_tasks),
            "completion_rate": completion_rate,
            "average_score": average_score,
            "passed_count": passed_count,
            "recent_tasks": recent_tasks,
        }
    )
