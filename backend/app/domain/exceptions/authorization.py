"""Authorization domain exceptions."""


class AuthorizationError(Exception):
    """Base class for authorization errors."""

    message: str = "Authorization error."


class UnauthorizedError(AuthorizationError):
    """Raised when authentication is required but not provided or invalid."""

    message = "Authentication required."


class ForbiddenError(AuthorizationError):
    """Raised when the authenticated user lacks required permissions."""

    message = "Insufficient permissions."
