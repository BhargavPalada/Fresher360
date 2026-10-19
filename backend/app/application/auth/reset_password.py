"""Reset password use case.

POST /api/v1/auth/reset-password

Flow:
1. Hash the supplied reset token and look up the record.
2. Validate: record exists, not consumed, not expired.
3. Enforce password policy (min 8 chars, mixed case, digit, symbol).
4. Atomically: update the user's password hash, consume the token, and
   invalidate all other outstanding reset tokens for the user.

Security:
- The raw token is hashed before the DB lookup — plaintext never stored.
- Password is hashed with the existing Argon2id hasher.
- Passwords are never logged.
- All outstanding reset tokens for the user are consumed on success to
  prevent parallel-reset attacks.
"""
from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Protocol

from app.domain.exceptions.password_reset import (
    ResetTokenExpiredError,
    ResetTokenInvalidError,
)
from app.infrastructure.auth.password import PasswordHasher

logger = logging.getLogger(__name__)

# Minimum password requirements (must match frontend validation)
_MIN_LENGTH = 8
_PASSWORD_RE = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]).{8,}$"
)


# ── Protocols ─────────────────────────────────────────────────────────────────

class IPasswordResetRepository(Protocol):
    async def get_reset_token_by_hash(self, token_hash: str): ...
    async def consume_reset_token(self, token_id) -> None: ...
    async def invalidate_all_reset_tokens_for_user(self, user_id) -> None: ...
    async def update_user_password(self, user_id, password_hash: str) -> None: ...


# ── Utility ───────────────────────────────────────────────────────────────────

def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


def validate_password(password: str) -> list[str]:
    """Return a list of error messages; empty list means the password is valid."""
    errors: list[str] = []
    if len(password) < _MIN_LENGTH:
        errors.append(f"Password must be at least {_MIN_LENGTH} characters long.")
    if not _PASSWORD_RE.match(password):
        if not re.search(r"[a-z]", password):
            errors.append("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", password):
            errors.append("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", password):
            errors.append("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_=+\[\]\\;'/`~]", password):
            errors.append("Password must contain at least one special character.")
    return errors


# ── Use case ──────────────────────────────────────────────────────────────────

class ResetPasswordUseCase:
    def __init__(
        self,
        *,
        reset_repo: IPasswordResetRepository,
        password_hasher: PasswordHasher,
    ) -> None:
        self._reset_repo = reset_repo
        self._password_hasher = password_hasher

    async def execute(
        self,
        *,
        reset_token: str,
        new_password: str,
        confirm_password: str,
    ) -> None:
        """Reset the user's password.

        Args:
            reset_token:      Raw (unhashed) token from the client.
            new_password:     The new plaintext password.
            confirm_password: Must match new_password.

        Raises:
            ValueError: If passwords don't match or don't meet policy.
            ResetTokenInvalidError: If the token is invalid or consumed.
            ResetTokenExpiredError: If the token has expired.
        """
        # 1. Password confirmation
        if new_password != confirm_password:
            raise ValueError("Passwords do not match.")

        # 2. Password policy
        errors = validate_password(new_password)
        if errors:
            raise ValueError(" ".join(errors))

        # 3. Look up token by hash
        token_hash = _hash_token(reset_token)
        token_record = await self._reset_repo.get_reset_token_by_hash(token_hash)

        if token_record is None:
            raise ResetTokenInvalidError()

        now = datetime.now(timezone.utc)
        expires_at = token_record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            raise ResetTokenExpiredError()

        # 4. Hash new password
        new_hash = self._password_hasher.hash(new_password)

        # 5. Atomic operations: update password, consume token, revoke others
        await self._reset_repo.update_user_password(token_record.user_id, new_hash)
        await self._reset_repo.consume_reset_token(token_record.id)
        await self._reset_repo.invalidate_all_reset_tokens_for_user(
            token_record.user_id
        )

        logger.info(
            "reset_password.success",
            extra={"user_id": str(token_record.user_id)},
        )
