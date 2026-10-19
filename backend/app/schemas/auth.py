"""Pydantic schemas for authentication API request/response.

API contract — consistent { data, error } envelope throughout.
Passwords and password hashes NEVER appear in response schemas.
"""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.domain.enums.user_role import UserRole


# ── Request Schemas ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login request. Role must NOT be supplied by client."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class RegisterRequest(BaseModel):
    """Registration request for new users. Default role is USER (Fresher)."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")


class UpdateUserRoleRequest(BaseModel):
    """Admin request to change user role."""
    role: UserRole = Field(..., description="Target role (ADMIN or USER)")


class AdminCreateUserRequest(BaseModel):
    """Admin request to directly create a user with specified role."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    role: UserRole = Field(default=UserRole.USER, description="User role (ADMIN or USER)")


# ── Response Sub-schemas ─────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe user representation — no password, no password_hash."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── API Envelope ─────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel):
    """Standard API envelope used by all endpoints."""
    data: Any = None
    error: ErrorDetail | None = None

    @classmethod
    def success(cls, data: Any) -> "ApiResponse":
        return cls(data=data, error=None)

    @classmethod
    def failure(cls, code: str, message: str) -> "ApiResponse":
        return cls(data=None, error=ErrorDetail(code=code, message=message))


# ── Refresh / Me Responses ───────────────────────────────────────────────────

class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse | None = None


# ── Forgot Password / OTP schemas ────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    """Request to initiate the forgot-password OTP flow."""
    email: EmailStr = Field(..., description="Registered user email address")


class VerifyOtpRequest(BaseModel):
    """Verify the 6-digit OTP to obtain a short-lived reset token."""
    email: EmailStr = Field(..., description="Email address the OTP was sent to")
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
        description="6-digit numeric OTP",
    )


class VerifyOtpResponse(BaseModel):
    """Returned on successful OTP verification."""
    reset_token: str = Field(..., description="Short-lived password-reset authorisation token")


class ResetPasswordRequest(BaseModel):
    """Request to set a new password using a valid reset token."""
    reset_token: str = Field(..., min_length=1, description="Reset token from verify-otp step")
    new_password: str = Field(
        ...,
        min_length=8,
        description="New password (min 8 chars, upper+lower+digit+special)",
    )
    confirm_password: str = Field(..., min_length=1, description="Must match new_password")
