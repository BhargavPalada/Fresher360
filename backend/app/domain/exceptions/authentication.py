"""Authentication domain exceptions."""


class AuthenticationError(Exception):
    """Base class for authentication errors."""

    message: str = "Authentication error."


class InvalidCredentialsError(AuthenticationError):
    """Raised when email or password is wrong."""

    message = "Invalid email or password."


class EmailNotFoundError(InvalidCredentialsError):
    """Raised when an email is not registered in the system."""

    message = "No account found with this email address."


class WrongPasswordError(InvalidCredentialsError):
    """Raised when the password is incorrect for an existing account."""

    message = "Incorrect password. Please try again."


class InactiveUserError(AuthenticationError):
    """Raised when a disabled user attempts to authenticate."""

    message = "User account is inactive."


class TokenExpiredError(AuthenticationError):
    """Raised when an access or refresh JWT has expired."""

    message = "Token has expired."


class TokenInvalidError(AuthenticationError):
    """Raised when a JWT cannot be decoded or has a bad structure."""

    message = "Token is invalid."
