"""Verify OTP use case.

POST /api/v1/auth/verify-reset-otp

Flow:
1. Retrieve the latest active (non-consumed) OTP challenge for the email.
2. Validate: not expired, not over attempt limit.
3. Compute HMAC of the supplied OTP and compare in constant time.
4. On failure: increment attempt counter.
5. On success: consume challenge, generate a short-lived reset token, store
   its SHA-256 hash, return the raw token.

Security:
- HMAC comparison uses ``hmac.compare_digest`` (constant-time).
- Raw reset token is generated with ``secrets.token_urlsafe(32)``.
- Only the SHA-256 hash of the reset token is stored.
- Never log OTPs or raw tokens.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Protocol

from app.application.auth.forgot_password import (
    OTP_MAX_ATTEMPTS,
    compute_otp_hmac,
)
from app.config import get_settings
from app.domain.exceptions.password_reset import (
    OtpAlreadyConsumedError,
    OtpExpiredError,
    OtpInvalidError,
    OtpMaxAttemptsError,
)

logger = logging.getLogger(__name__)
_settings = get_settings()

RESET_TOKEN_EXPIRE_MINUTES: int = getattr(_settings, "RESET_TOKEN_EXPIRE_MINUTES", 15)


# ── Protocols ─────────────────────────────────────────────────────────────────

class IPasswordResetRepository(Protocol):
    async def get_latest_active_challenge(self, email: str): ...
    async def increment_attempt(self, challenge_id) -> None: ...
    async def consume_challenge(self, challenge_id) -> None: ...
    async def create_reset_token(self, *, user_id, challenge_id, token_hash: str, expires_at) -> None: ...


class IUserRepository(Protocol):
    async def get_by_email(self, email: str): ...


# ── Utility ───────────────────────────────────────────────────────────────────

def _hash_token(raw_token: str) -> str:
    """SHA-256 hash of a raw reset token."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


# ── Use case ──────────────────────────────────────────────────────────────────

class VerifyOtpUseCase:
    def __init__(
        self,
        *,
        reset_repo: IPasswordResetRepository,
        user_repo: IUserRepository,
    ) -> None:
        self._reset_repo = reset_repo
        self._user_repo = user_repo

    async def execute(self, email: str, otp: str) -> str:
        """Validate the OTP and return a short-lived password-reset token.

        Args:
            email: The email address the OTP was issued for.
            otp:   The 6-digit code submitted by the user.

        Returns:
            A raw (unhashed) reset token the client must supply to
            /reset-password.

        Raises:
            OtpExpiredError, OtpMaxAttemptsError, OtpInvalidError,
            OtpAlreadyConsumedError
        """
        email_norm = email.lower().strip()

        challenge = await self._reset_repo.get_latest_active_challenge(email_norm)

        # Treat non-existent, expired, and exhausted challenges uniformly.
        if challenge is None:
            raise OtpInvalidError()

        now = datetime.now(timezone.utc)

        # Ensure expires_at is timezone-aware for comparison
        expires_at = challenge.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            raise OtpExpiredError()

        if challenge.attempt_count >= OTP_MAX_ATTEMPTS:
            raise OtpMaxAttemptsError()

        # Constant-time HMAC comparison
        expected_hmac = compute_otp_hmac(otp, email_norm)
        if not hmac.compare_digest(expected_hmac, challenge.otp_hmac):
            await self._reset_repo.increment_attempt(challenge.id)
            raise OtpInvalidError()

        # OTP verified — consume challenge (single-use)
        await self._reset_repo.consume_challenge(challenge.id)

        # Look up the user to get their UUID for the reset token
        user = await self._user_repo.get_by_email(email_norm)
        if user is None:
            # Should not happen (challenge exists for email), but guard anyway
            raise OtpInvalidError()

        # Issue a short-lived reset token
        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        expires_at_token = datetime.now(timezone.utc) + timedelta(
            minutes=RESET_TOKEN_EXPIRE_MINUTES
        )

        await self._reset_repo.create_reset_token(
            user_id=user.id,
            challenge_id=challenge.id,
            token_hash=token_hash,
            expires_at=expires_at_token,
        )

        logger.info(
            "verify_otp.success",
            extra={"user_id": str(user.id)},
        )

        return raw_token
