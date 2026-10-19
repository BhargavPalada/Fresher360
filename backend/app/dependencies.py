"""FastAPI dependency injection — authentication and authorization.

These are the reusable guards consumed by all protected endpoints.
"""
from __future__ import annotations

import logging

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.application.auth.get_current_user import GetCurrentUserUseCase
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.domain.exceptions.authentication import (
    AuthenticationError,
    InactiveUserError,
    TokenExpiredError,
    TokenInvalidError,
)
from app.domain.exceptions.authorization import ForbiddenError
from app.infrastructure.auth.jwt import JWTService
from app.infrastructure.auth.password import PasswordHasher
from app.application.tasks.task_service import TaskService
from app.infrastructure.database.repositories.task_repository import TaskRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.repositories.password_reset_repository import PasswordResetRepository
from app.infrastructure.database.session import AsyncSession, get_db


logger = logging.getLogger(__name__)

# ── Reusable singletons ───────────────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=False)
_password_hasher = PasswordHasher()
_jwt_service = JWTService()


# ── Infrastructure dependencies ───────────────────────────────────────────────

def get_password_hasher() -> PasswordHasher:
    return _password_hasher


def get_jwt_service() -> JWTService:
    return _jwt_service


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(session)


def get_task_repository(session: AsyncSession = Depends(get_db)) -> TaskRepository:
    return TaskRepository(session)


def get_task_service(
    task_repo: TaskRepository = Depends(get_task_repository),
) -> TaskService:
    return TaskService(task_repo)


def get_password_reset_repository(session: AsyncSession = Depends(get_db)) -> PasswordResetRepository:
    return PasswordResetRepository(session)


# ── Authentication ────────────────────────────────────────────────────────────

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Extract and validate Bearer token, then load the current user.

    Raises 401 for any authentication failure.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required."},
            headers={"WWW-Authenticate": "Bearer"},
        )

    use_case = GetCurrentUserUseCase(
        user_repo=user_repo,
        jwt_service=_jwt_service,
    )

    try:
        return await use_case.execute(credentials.credentials)
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token has expired."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (TokenInvalidError, AuthenticationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Token is invalid."},
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InactiveUserError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_INACTIVE", "message": "User account is inactive."},
        )


# ── Authorization ─────────────────────────────────────────────────────────────

async def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require any authenticated user (any role)."""
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require ADMIN role. Returns 403 for USER role."""
    if current_user.role != UserRole.ADMIN:
        logger.warning(
            "authz.forbidden",
            extra={"user_id": str(current_user.id), "role": current_user.role.value},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Insufficient permissions."},
        )
    return current_user


async def require_role_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require USER role specifically."""
    if current_user.role != UserRole.USER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Insufficient permissions."},
        )
    return current_user
