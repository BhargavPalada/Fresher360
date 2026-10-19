"""SQLAlchemy ORM models for OTP challenges and password-reset tokens.

Infrastructure concern only — maps to the two new tables introduced by
migration 0002. No domain logic here.
"""
from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.session import Base


class OtpChallengeModel(Base):
    """Stores a per-email OTP challenge for the forgot-password flow.

    Security notes:
    - ``otp_hmac`` stores a keyed HMAC digest of the OTP (never the OTP itself).
    - ``is_consumed`` flips to True once the OTP has been successfully verified.
    - ``attempt_count`` is incremented on every failed guess; requests are
      rejected once the limit is exceeded.
    """

    __tablename__ = "otp_challenges"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sa.text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(sa.String(255), nullable=False, index=True)
    otp_hmac: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False
    )
    attempt_count: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, default=0, server_default=sa.text("0")
    )
    is_consumed: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, default=False, server_default=sa.false()
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )

    # back-reference is optional but useful for cascade deletes
    reset_tokens: Mapped[list["PasswordResetTokenModel"]] = relationship(
        "PasswordResetTokenModel",
        back_populates="challenge",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<OtpChallengeModel id={self.id} email={self.email} consumed={self.is_consumed}>"


class PasswordResetTokenModel(Base):
    """A short-lived, single-use authorisation token issued after OTP verification.

    Security notes:
    - ``token_hash`` stores the SHA-256 hash of the raw token sent to the client.
    - ``is_consumed`` flips to True atomically when the password is reset.
    """

    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=sa.text("gen_random_uuid()"),
    )
    # The UUID of the user whose password should be reset.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Foreign key back to the OTP challenge that produced this token.
    challenge_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("otp_challenges.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(sa.String(128), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False
    )
    is_consumed: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, default=False, server_default=sa.false()
    )
    created_at: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
    )
    consumed_at: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
    )

    challenge: Mapped["OtpChallengeModel"] = relationship(
        "OtpChallengeModel", back_populates="reset_tokens"
    )

    def __repr__(self) -> str:
        return f"<PasswordResetTokenModel id={self.id} user_id={self.user_id} consumed={self.is_consumed}>"
