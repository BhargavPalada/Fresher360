"""Password-reset repository — data-access layer for OTP challenges and
password-reset tokens.

Infrastructure layer — no domain or HTTP logic.
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.models.password_reset import (
    OtpChallengeModel,
    PasswordResetTokenModel,
)

logger = logging.getLogger(__name__)


class PasswordResetRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── OTP challenge helpers ──────────────────────────────────────────────────

    async def create_otp_challenge(
        self,
        *,
        email: str,
        otp_hmac: str,
        expires_at: datetime,
    ) -> OtpChallengeModel:
        """Persist a new OTP challenge record and return it."""
        challenge = OtpChallengeModel(
            id=uuid.uuid4(),
            email=email.lower().strip(),
            otp_hmac=otp_hmac,
            expires_at=expires_at,
        )
        self._session.add(challenge)
        await self._session.commit()
        await self._session.refresh(challenge)
        return challenge

    async def get_latest_active_challenge(
        self, email: str
    ) -> OtpChallengeModel | None:
        """Return the most-recently created, non-consumed challenge for *email*."""
        result = await self._session.execute(
            select(OtpChallengeModel)
            .where(
                OtpChallengeModel.email == email.lower().strip(),
                OtpChallengeModel.is_consumed.is_(False),
            )
            .order_by(OtpChallengeModel.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def increment_attempt(self, challenge_id: uuid.UUID) -> None:
        """Atomically increment the failed-attempt counter."""
        await self._session.execute(
            update(OtpChallengeModel)
            .where(OtpChallengeModel.id == challenge_id)
            .values(attempt_count=OtpChallengeModel.attempt_count + 1)
        )
        await self._session.commit()

    async def consume_challenge(self, challenge_id: uuid.UUID) -> None:
        """Mark a challenge as consumed (single-use enforcement)."""
        await self._session.execute(
            update(OtpChallengeModel)
            .where(OtpChallengeModel.id == challenge_id)
            .values(is_consumed=True)
        )
        await self._session.commit()

    async def count_recent_challenges(self, email: str, since: datetime) -> int:
        """Count OTP challenges created for *email* since *since* (rate-limit check)."""
        from sqlalchemy import func, select as sa_select
        result = await self._session.execute(
            sa_select(func.count()).where(
                OtpChallengeModel.email == email.lower().strip(),
                OtpChallengeModel.created_at >= since,
            )
        )
        return result.scalar_one()

    # ── Reset token helpers ────────────────────────────────────────────────────

    async def create_reset_token(
        self,
        *,
        user_id: uuid.UUID,
        challenge_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> PasswordResetTokenModel:
        """Persist a new reset-token record and return it."""
        token_record = PasswordResetTokenModel(
            id=uuid.uuid4(),
            user_id=user_id,
            challenge_id=challenge_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self._session.add(token_record)
        await self._session.commit()
        await self._session.refresh(token_record)
        return token_record

    async def get_reset_token_by_hash(
        self, token_hash: str
    ) -> PasswordResetTokenModel | None:
        """Look up a reset token by its SHA-256 hash."""
        result = await self._session.execute(
            select(PasswordResetTokenModel).where(
                PasswordResetTokenModel.token_hash == token_hash,
                PasswordResetTokenModel.is_consumed.is_(False),
            )
        )
        return result.scalar_one_or_none()

    async def consume_reset_token(self, token_id: uuid.UUID) -> None:
        """Mark a reset token as consumed and stamp the consumed_at time."""
        now = datetime.now(timezone.utc)
        await self._session.execute(
            update(PasswordResetTokenModel)
            .where(PasswordResetTokenModel.id == token_id)
            .values(is_consumed=True, consumed_at=now)
        )
        await self._session.commit()

    async def invalidate_all_reset_tokens_for_user(
        self, user_id: uuid.UUID
    ) -> None:
        """Consume all outstanding (non-consumed) reset tokens for *user_id*.

        Called after a successful password change to prevent token replay.
        """
        now = datetime.now(timezone.utc)
        await self._session.execute(
            update(PasswordResetTokenModel)
            .where(
                PasswordResetTokenModel.user_id == user_id,
                PasswordResetTokenModel.is_consumed.is_(False),
            )
            .values(is_consumed=True, consumed_at=now)
        )
        await self._session.commit()

    # ── User password update ───────────────────────────────────────────────────

    async def update_user_password(
        self, user_id: uuid.UUID, password_hash: str
    ) -> None:
        """Update the user's password_hash column and bump updated_at."""
        from sqlalchemy import update as sa_update, func
        from app.infrastructure.database.models.user import UserModel

        await self._session.execute(
            sa_update(UserModel)
            .where(UserModel.id == user_id)
            .values(password_hash=password_hash, updated_at=func.now())
        )
        await self._session.commit()
        logger.info("user.password_reset", extra={"user_id": str(user_id)})
