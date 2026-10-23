"""Login use case.

Orchestrates: email lookup → password verify → token issuance.
No FastAPI or HTTP concerns here.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

from app.application.auth.interfaces import IJWTService, IPasswordHasher, IUserRepository
from app.domain.exceptions.authentication import (
    InvalidCredentialsError,
    InactiveUserError,
    EmailNotFoundError,
    WrongPasswordError,
)

logger = logging.getLogger(__name__)


@dataclass
class LoginResult:
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        password_hasher: IPasswordHasher,
        jwt_service: IJWTService,
    ) -> None:
        self._user_repo = user_repo
        self._password_hasher = password_hasher
        self._jwt_service = jwt_service

    async def execute(self, email: str, password: str) -> LoginResult:
        """Authenticate user and return access + refresh tokens.

        Security:
        - Email is normalized before lookup.
        - Checks whether email exists first, then validates password.
        - Password is never logged.
        """
        email_normalized = email.lower().strip()

        user = await self._user_repo.get_by_email(email_normalized)

        if user is None:
            # Verify a dummy hash to maintain constant time (prevent timing attacks)
            self._password_hasher.verify(password, "$argon2id$v=19$m=65536,t=2,p=1$dummy")
            logger.warning(
                "login.failed.unknown_email",
                extra={"email": email_normalized},
            )
            raise EmailNotFoundError()

        if not self._password_hasher.verify(password, user.password_hash):
            logger.warning(
                "login.failed.wrong_password",
                extra={"user_id": str(user.id)},
            )
            raise WrongPasswordError()

        if not user.is_active:
            logger.warning(
                "login.failed.inactive_user",
                extra={"user_id": str(user.id)},
            )
            raise InactiveUserError()

        access_token = self._jwt_service.encode_access_token(user.id, user.role)
        refresh_token = self._jwt_service.encode_refresh_token(user.id)

        logger.info(
            "login.success",
            extra={"user_id": str(user.id), "role": user.role.value},
        )

        return LoginResult(
            access_token=access_token,
            refresh_token=refresh_token,
        )
