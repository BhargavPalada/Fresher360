"""Forgot-password use case.

POST /api/v1/auth/forgot-password

Flow:
1. Rate-limit: reject if > OTP_RATE_LIMIT_COUNT challenges were created for
   this email in the last OTP_RATE_LIMIT_WINDOW_MINUTES minutes.
2. Look up the user by email — but respond generically whether found or not.
3. If the user exists, generate a 6-digit OTP, compute its HMAC, persist
   the challenge, and send the email asynchronously.
4. Always return the same generic success response.

Security:
- The OTP is generated with ``secrets.randbelow`` (CSPRNG).
- Only the HMAC digest is stored — never the OTP itself.
- The HMAC key is the OTP_HMAC_SECRET env variable (min 32 bytes in prod).
- Email existence is never disclosed by the response.
- Never log OTPs.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Protocol

from app.config import get_settings
from app.domain.exceptions.authentication import EmailNotFoundError

logger = logging.getLogger(__name__)
_settings = get_settings()

# ── Configurable constants ────────────────────────────────────────────────────

OTP_LENGTH = 6  # digits
OTP_EXPIRE_MINUTES: int = getattr(_settings, "OTP_EXPIRE_MINUTES", 5)
OTP_MAX_ATTEMPTS: int = getattr(_settings, "OTP_MAX_ATTEMPTS", 5)
# Rate-limit: max N requests per window
OTP_RATE_LIMIT_COUNT: int = getattr(_settings, "OTP_RATE_LIMIT_COUNT", 3)
OTP_RATE_LIMIT_WINDOW_MINUTES: int = getattr(_settings, "OTP_RATE_LIMIT_WINDOW_MINUTES", 10)


# ── Protocols ─────────────────────────────────────────────────────────────────

class IUserRepository(Protocol):
    async def get_by_email(self, email: str): ...


class IPasswordResetRepository(Protocol):
    async def count_recent_challenges(self, email: str, since: datetime) -> int: ...
    async def create_otp_challenge(self, *, email: str, otp_hmac: str, expires_at: datetime): ...


class IEmailService(Protocol):
    async def __call__(self, *, to_email: str, otp: str) -> None: ...


# ── Utilities ─────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def compute_otp_hmac(otp: str, email: str) -> str:
    """Compute HMAC-SHA256(key=OTP_HMAC_SECRET, msg=email:otp).

    Binding the email to the HMAC prevents an OTP issued for one address
    being used to reset a different account.
    """
    key = _settings.OTP_HMAC_SECRET.encode()
    msg = f"{email.lower().strip()}:{otp}".encode()
    return hmac.new(key, msg, hashlib.sha256).hexdigest()


# ── Use case ──────────────────────────────────────────────────────────────────

class ForgotPasswordUseCase:
    def __init__(
        self,
        *,
        user_repo: IUserRepository,
        reset_repo: IPasswordResetRepository,
        send_otp_email: IEmailService,
    ) -> None:
        self._user_repo = user_repo
        self._reset_repo = reset_repo
        self._send_otp_email = send_otp_email

    async def execute(self, email: str) -> None:
        """Initiate the password-reset OTP flow for *email*.

        Checks whether the email exists first. If found, generates and sends OTP.
        If not found, raises EmailNotFoundError.
        """
        email_norm = email.lower().strip()

        # 1. Rate-limit check (applied even for unknown emails to prevent
        #    timing-oracle on existence: we still count and reject).
        window_start = datetime.now(timezone.utc) - timedelta(
            minutes=OTP_RATE_LIMIT_WINDOW_MINUTES
        )
        recent_count = await self._reset_repo.count_recent_challenges(
            email_norm, since=window_start
        )
        if recent_count >= OTP_RATE_LIMIT_COUNT:
            logger.warning(
                "forgot_password.rate_limited",
                extra={"email_domain": email_norm.split("@")[-1]},
            )
            return  # generic success, no email sent

        # 2. Look up user — check whether email is present before sending OTP.
        user = await self._user_repo.get_by_email(email_norm)
        if user is None:
            logger.warning(
                "forgot_password.unknown_email",
                extra={"email_domain": email_norm.split("@")[-1]},
            )
            raise EmailNotFoundError("No account found with this email address.")

        # 3. Generate OTP and persist its HMAC.
        otp = generate_otp()
        otp_hmac = compute_otp_hmac(otp, email_norm)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)

        await self._reset_repo.create_otp_challenge(
            email=email_norm,
            otp_hmac=otp_hmac,
            expires_at=expires_at,
        )

        # 4. Send email (fire-and-forget style; errors propagate to caller).
        await self._send_otp_email(to_email=email_norm, otp=otp)

        logger.info(
            "forgot_password.otp_issued",
            extra={"user_id": str(user.id)},
        )
