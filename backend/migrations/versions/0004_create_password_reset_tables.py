"""Migration 0004: create otp_challenges and password_reset_tokens tables.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-19
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── otp_challenges ─────────────────────────────────────────────────────────
    op.create_table(
        "otp_challenges",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        # email is NOT a FK — we still respond generically for unknown emails
        sa.Column("email", sa.String(255), nullable=False),
        # HMAC digest of the OTP; never the OTP itself
        sa.Column("otp_hmac", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "attempt_count",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
        sa.Column(
            "is_consumed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_otp_challenges_email", "otp_challenges", ["email"])

    # ── password_reset_tokens ───────────────────────────────────────────────────
    op.create_table(
        "password_reset_tokens",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "challenge_id",
            UUID(as_uuid=True),
            sa.ForeignKey("otp_challenges.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # SHA-256 hash of the raw token
        sa.Column("token_hash", sa.String(128), nullable=False),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column(
            "is_consumed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("consumed_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index("ix_prt_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_prt_token_hash", "password_reset_tokens", ["token_hash"])


def downgrade() -> None:
    op.drop_index("ix_prt_token_hash", table_name="password_reset_tokens")
    op.drop_index("ix_prt_user_id", table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")

    op.drop_index("ix_otp_challenges_email", table_name="otp_challenges")
    op.drop_table("otp_challenges")
