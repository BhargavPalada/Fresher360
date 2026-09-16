"""Logout use case.

Server-side logout: signals that the refresh cookie must be cleared.
With stateless JWTs, this is the primary invalidation mechanism.
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class LogoutUseCase:
    """Handles the business logic side of logout.

    For stateless JWT MVP: the cookie clearing is done in the API layer.
    This use case handles any future server-side revocation logic
    (e.g., adding token to a Redis blocklist).
    """

    async def execute(self, user_id: str | None = None) -> None:
        """Log the logout event."""
        logger.info("logout.success", extra={"user_id": user_id or "anonymous"})
