"""Get current user use case.

Validates an access token and loads the corresponding user.
Always re-reads from DB — does not trust the JWT alone for existence/active status.
"""
from __future__ import annotations

import logging
import uuid

from app.application.auth.interfaces import IJWTService, IUserRepository
from app.domain.entities.user import User
from app.domain.exceptions.authentication import InactiveUserError, TokenInvalidError

logger = logging.getLogger(__name__)


class GetCurrentUserUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        jwt_service: IJWTService,
    ) -> None:
        self._user_repo = user_repo
        self._jwt_service = jwt_service

    async def execute(self, token: str) -> User:
        """Decode access token and return the authenticated user.

        Raises:
            TokenExpiredError: token is expired.
            TokenInvalidError: token is malformed.
            TokenInvalidError: user no longer exists.
            InactiveUserError: user exists but is deactivated.
        """
        payload = self._jwt_service.decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])

        user = await self._user_repo.get_by_id(user_id)
        if user is None:
            logger.warning(
                "get_current_user.user_not_found",
                extra={"user_id": str(user_id)},
            )
            raise TokenInvalidError()

        if not user.is_active:
            logger.warning(
                "get_current_user.inactive_user",
                extra={"user_id": str(user_id)},
            )
            raise InactiveUserError()

        return user
