"""Refresh token use case.

Validates a refresh token cookie → issues a new access token.
Always re-reads the user from DB to check existence and is_active.
"""
from __future__ import annotations

import logging
import uuid

from app.application.auth.interfaces import IJWTService, IUserRepository
from app.domain.entities.user import User
from app.domain.exceptions.authentication import InvalidCredentialsError, InactiveUserError

logger = logging.getLogger(__name__)


class RefreshTokenUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        jwt_service: IJWTService,
    ) -> None:
        self._user_repo = user_repo
        self._jwt_service = jwt_service

    async def execute(self, refresh_token: str) -> tuple[str, User]:
        """Validate refresh token and return a new access token + user.

        Raises:
            TokenExpiredError: if the refresh token is expired.
            TokenInvalidError: if the refresh token is structurally invalid.
            InvalidCredentialsError: if the user no longer exists.
            InactiveUserError: if the user is deactivated.
        """
        payload = self._jwt_service.decode_refresh_token(refresh_token)
        user_id = uuid.UUID(payload["sub"])

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            logger.warning("refresh.failed.user_not_found", extra={"user_id": str(user_id)})
            raise InvalidCredentialsError()

        if not user.is_active:
            logger.warning("refresh.failed.inactive_user", extra={"user_id": str(user_id)})
            raise InactiveUserError()

        access_token = self._jwt_service.encode_access_token(user.id, user.role)

        logger.info("refresh.success", extra={"user_id": str(user.id)})
        return access_token, user
