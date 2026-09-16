"""JWT service — access + refresh token management.

Infrastructure layer: implements IJWTService.
Uses separate secrets for access and refresh tokens.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from app.application.auth.interfaces import IJWTService
from app.config import get_settings
from app.domain.enums.user_role import UserRole
from app.domain.exceptions.authentication import TokenExpiredError, TokenInvalidError

_settings = get_settings()

_ACCESS_TOKEN_TYPE = "access"
_REFRESH_TOKEN_TYPE = "refresh"


class JWTService(IJWTService):
    """JWT access + refresh token service."""

    def encode_access_token(self, user_id: uuid.UUID, role: UserRole) -> str:
        """Issue a short-lived access token (15 min default)."""
        now = datetime.now(tz=timezone.utc)
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "role": role.value,
            "type": _ACCESS_TOKEN_TYPE,
            "iat": now,
            "exp": now + timedelta(minutes=_settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(
            payload,
            _settings.JWT_SECRET,
            algorithm=_settings.JWT_ALGORITHM,
        )

    def encode_refresh_token(self, user_id: uuid.UUID) -> str:
        """Issue a long-lived refresh token (7 days default).

        Note: No role in refresh token — always re-read from DB on refresh.
        """
        now = datetime.now(tz=timezone.utc)
        payload: dict[str, Any] = {
            "sub": str(user_id),
            "type": _REFRESH_TOKEN_TYPE,
            "iat": now,
            "exp": now + timedelta(days=_settings.REFRESH_TOKEN_EXPIRE_DAYS),
        }
        return jwt.encode(
            payload,
            _settings.JWT_REFRESH_SECRET,
            algorithm=_settings.JWT_ALGORITHM,
        )

    def decode_access_token(self, token: str) -> dict[str, Any]:
        """Decode and validate an access token. Raises on failure."""
        return self._decode(
            token,
            secret=_settings.JWT_SECRET,
            expected_type=_ACCESS_TOKEN_TYPE,
        )

    def decode_refresh_token(self, token: str) -> dict[str, Any]:
        """Decode and validate a refresh token. Raises on failure."""
        return self._decode(
            token,
            secret=_settings.JWT_REFRESH_SECRET,
            expected_type=_REFRESH_TOKEN_TYPE,
        )

    # ── Private ────────────────────────────────────────────────────────────

    @staticmethod
    def _decode(token: str, *, secret: str, expected_type: str) -> dict[str, Any]:
        try:
            payload: dict[str, Any] = jwt.decode(
                token,
                secret,
                algorithms=[_settings.JWT_ALGORITHM],
            )
        except ExpiredSignatureError:
            raise TokenExpiredError()
        except JWTError:
            raise TokenInvalidError()

        # Validate token type to prevent access tokens being used as refresh tokens
        if payload.get("type") != expected_type:
            raise TokenInvalidError()

        if not payload.get("sub"):
            raise TokenInvalidError()

        return payload
