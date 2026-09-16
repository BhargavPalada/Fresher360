"""User repository — infrastructure implementation of IUserRepository."""
from __future__ import annotations

import uuid
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.auth.interfaces import IUserRepository
from app.domain.entities.user import User
from app.domain.enums.user_role import UserRole
from app.infrastructure.database.models.user import UserModel

logger = logging.getLogger(__name__)


def _model_to_entity(model: UserModel) -> User:
    """Map ORM model → domain entity."""
    return User(
        id=model.id,
        email=model.email,
        password_hash=model.password_hash,
        first_name=model.first_name,
        last_name=model.last_name,
        role=model.role,
        is_active=model.is_active,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


class UserRepository(IUserRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.email == email.lower().strip())
        )
        model = result.scalar_one_or_none()
        return _model_to_entity(model) if model else None

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        return _model_to_entity(model) if model else None

    async def create(self, user: User) -> User:
        model = UserModel(
            id=user.id,
            email=user.email,
            password_hash=user.password_hash,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        self._session.add(model)
        await self._session.commit()
        await self._session.refresh(model)
        logger.info("user.created", extra={"user_id": str(user.id), "role": user.role.value})
        return _model_to_entity(model)

    async def email_exists(self, email: str) -> bool:
        result = await self._session.execute(
            select(UserModel.id).where(UserModel.email == email.lower().strip())
        )
        return result.scalar_one_or_none() is not None

    async def get_all(self) -> list[User]:
        result = await self._session.execute(
            select(UserModel).order_by(UserModel.created_at.desc())
        )
        models = result.scalars().all()
        return [_model_to_entity(m) for m in models]

    async def update_role(self, user_id: uuid.UUID, role: UserRole) -> User | None:
        result = await self._session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        model = result.scalar_one_or_none()
        if not model:
            return None
        model.role = role
        await self._session.commit()
        await self._session.refresh(model)
        logger.info("user.role_updated", extra={"user_id": str(user_id), "new_role": role.value})
        return _model_to_entity(model)
