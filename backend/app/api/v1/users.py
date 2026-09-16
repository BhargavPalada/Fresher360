"""Users API — profile and admin user management endpoints.

Endpoints:
- GET   /api/v1/users/profile             (authenticated user)
- GET   /api/v1/users/admin/list          (admin only)
- PATCH /api/v1/users/admin/{user_id}/role (admin only)
- POST  /api/v1/users/admin/create        (admin only)
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import (
    get_password_hasher,
    get_user_repository,
    require_admin,
    require_authenticated_user,
)
from app.domain.entities.user import User
from app.infrastructure.auth.password import PasswordHasher
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AdminCreateUserRequest,
    ApiResponse,
    UpdateUserRoleRequest,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=ApiResponse)
async def get_profile(
    current_user: User = Depends(require_authenticated_user),
) -> ApiResponse:
    """Return the authenticated user's profile."""
    return ApiResponse.success(
        UserResponse(
            id=str(current_user.id),
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            role=current_user.role.value,
            is_active=current_user.is_active,
        ).model_dump()
    )


@router.get("/admin/list", response_model=ApiResponse)
async def list_users_admin(
    current_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApiResponse:
    """Admin-only: list all registered users from database."""
    users = await user_repo.get_all()
    data = [
        UserResponse(
            id=str(u.id),
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            role=u.role.value,
            is_active=u.is_active,
        ).model_dump()
        for u in users
    ]
    return ApiResponse.success(data)


@router.patch("/admin/{user_id}/role", response_model=ApiResponse)
async def update_user_role_admin(
    user_id: uuid.UUID,
    body: UpdateUserRoleRequest,
    current_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ApiResponse:
    """Admin-only: update a user's role (ADMIN or USER)."""
    updated_user = await user_repo.update_role(user_id, body.role)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "User not found."},
        )
    return ApiResponse.success(
        UserResponse(
            id=str(updated_user.id),
            email=updated_user.email,
            first_name=updated_user.first_name,
            last_name=updated_user.last_name,
            role=updated_user.role.value,
            is_active=updated_user.is_active,
        ).model_dump()
    )


@router.post("/admin/create", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_user_admin(
    body: AdminCreateUserRequest,
    current_user: User = Depends(require_admin),
    user_repo: UserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
) -> ApiResponse:
    """Admin-only: directly create a new user with specified role."""
    if await user_repo.email_exists(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists."},
        )

    user = User.create(
        email=body.email,
        password_hash=password_hasher.hash(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=body.role,
    )
    created_user = await user_repo.create(user)
    return ApiResponse.success(
        UserResponse(
            id=str(created_user.id),
            email=created_user.email,
            first_name=created_user.first_name,
            last_name=created_user.last_name,
            role=created_user.role.value,
            is_active=created_user.is_active,
        ).model_dump()
    )
