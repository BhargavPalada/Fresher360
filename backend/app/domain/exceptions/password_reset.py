"""Password-reset domain exceptions."""


class OtpError(Exception):
    """Base class for OTP-related errors."""
    message: str = "OTP error."


class OtpExpiredError(OtpError):
    """The OTP challenge has passed its expiry time."""
    message = "The OTP has expired. Please request a new one."


class OtpInvalidError(OtpError):
    """The OTP value does not match the stored HMAC."""
    message = "The OTP is incorrect."


class OtpMaxAttemptsError(OtpError):
    """Too many wrong guesses; challenge is locked."""
    message = "Maximum OTP attempts exceeded. Please request a new code."


class OtpAlreadyConsumedError(OtpError):
    """The OTP was already successfully verified."""
    message = "This OTP has already been used."


class ResetTokenInvalidError(Exception):
    """The reset token is not found, expired, or already consumed."""
    message = "The password reset link is invalid or has expired."


class ResetTokenExpiredError(ResetTokenInvalidError):
    """The reset token exists but has passed its expiry time."""
    message = "The password reset link has expired. Please start over."
