"""Authentication API endpoints.

POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-reset-otp
POST /api/v1/auth/reset-password
"""
from __future__ import annotations

import logging
from datetime import timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.application.auth.login import LoginUseCase
from app.application.auth.logout import LogoutUseCase
from app.application.auth.refresh_token import RefreshTokenUseCase
from app.application.auth.forgot_password import ForgotPasswordUseCase
from app.application.auth.verify_otp import VerifyOtpUseCase
from app.application.auth.reset_password import ResetPasswordUseCase
from app.config import get_settings
from app.dependencies import (
    get_current_user,
    get_jwt_service,
    get_password_hasher,
    get_user_repository,
    get_password_reset_repository,
)
from app.domain.entities.user import User
from app.domain.exceptions.authentication import (
    AuthenticationError,
    InactiveUserError,
    InvalidCredentialsError,
    TokenExpiredError,
    TokenInvalidError,
)
from app.domain.exceptions.password_reset import (
    OtpExpiredError,
    OtpInvalidError,
    OtpMaxAttemptsError,
    OtpAlreadyConsumedError,
    ResetTokenInvalidError,
    ResetTokenExpiredError,
)
from app.domain.enums.user_role import UserRole
from app.infrastructure.auth.jwt import JWTService
from app.infrastructure.auth.password import PasswordHasher
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.repositories.password_reset_repository import PasswordResetRepository
from app.infrastructure.email.email_service import send_otp_email
from app.schemas.auth import (
    ApiResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    RefreshResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

_settings = get_settings()

_REFRESH_COOKIE_NAME = "refresh_token"
_REFRESH_COOKIE_PATH = "/"


def _get_cookie_security_params() -> tuple[bool, str]:
    """Determine secure flag and samesite policy for cookies based on environment and config."""
    secure = (
        _settings.COOKIE_SECURE
        if _settings.COOKIE_SECURE is not None
        else (_settings.APP_ENV != "development")
    )
    samesite = _settings.COOKIE_SAMESITE.lower()
    if samesite == "none":
        secure = True
    return secure, samesite


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Set the HttpOnly refresh token cookie."""
    secure, samesite = _get_cookie_security_params()
    response.set_cookie(
        key=_REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path=_REFRESH_COOKIE_PATH,
        max_age=int(timedelta(days=_settings.REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear the refresh token cookie (logout)."""
    secure, samesite = _get_cookie_security_params()
    response.delete_cookie(
        key=_REFRESH_COOKIE_NAME,
        path=_REFRESH_COOKIE_PATH,
        httponly=True,
        secure=secure,
        samesite=samesite,
    )


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user.role.value,
    )


# ── POST /auth/login ──────────────────────────────────────────────────────────

@router.post("/login", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def login(
    body: LoginRequest,
    response: Response,
    user_repo: UserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    jwt_service: JWTService = Depends(get_jwt_service),
) -> ApiResponse:
    """Authenticate user with email + password.

    Returns an access token in the response body and sets an HttpOnly
    refresh token cookie scoped to /api/v1/auth/refresh.

    The client must NEVER supply a role — it is determined from the database.
    """
    use_case = LoginUseCase(
        user_repo=user_repo,
        password_hasher=password_hasher,
        jwt_service=jwt_service,
    )

    try:
        result = await use_case.execute(body.email, body.password)
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "INVALID_CREDENTIALS", "message": "Invalid email or password."},
        )
    except InactiveUserError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_INACTIVE", "message": "User account is inactive."},
        )

    # Load user to include in response
    user = await user_repo.get_by_email(body.email)
    assert user is not None  # guaranteed after successful login

    _set_refresh_cookie(response, result.refresh_token)

    return ApiResponse.success(
        TokenResponse(
            access_token=result.access_token,
            token_type=result.token_type,
            user=_user_to_response(user),
        ).model_dump()
    )


# ── POST /auth/register ───────────────────────────────────────────────────────

@router.post("/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    response: Response,
    user_repo: UserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    jwt_service: JWTService = Depends(get_jwt_service),
) -> ApiResponse:
    """Register a new user into the database with default role USER (Fresher).
    
    Hashes the password with Argon2id, creates the user record, and automatically
    returns access and refresh tokens for immediate login.
    """
    if await user_repo.email_exists(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "message": "An account with this email already exists."},
        )

    user = User.create(
        email=body.email,
        password_hash=password_hasher.hash(body.password),
        first_name=body.first_name,
        last_name=body.last_name,
        role=UserRole.USER,
    )
    created_user = await user_repo.create(user)

    # Issue JWT tokens for immediate authentication
    access_token = jwt_service.encode_access_token(created_user.id, created_user.role)
    refresh_token = jwt_service.encode_refresh_token(created_user.id)
    _set_refresh_cookie(response, refresh_token)

    return ApiResponse.success(
        TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=_user_to_response(created_user),
        ).model_dump()
    )


# ── POST /auth/refresh ────────────────────────────────────────────────────────

@router.post("/refresh", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=_REFRESH_COOKIE_NAME),
    user_repo: UserRepository = Depends(get_user_repository),
    jwt_service: JWTService = Depends(get_jwt_service),
) -> ApiResponse:
    """Issue a new access token using the HttpOnly refresh token cookie."""
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Refresh token missing."},
        )

    use_case = RefreshTokenUseCase(user_repo=user_repo, jwt_service=jwt_service)

    try:
        access_token, user = await use_case.execute(refresh_token)
    except TokenExpiredError:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Refresh token expired. Please log in again."},
        )
    except (TokenInvalidError, AuthenticationError, InvalidCredentialsError):
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Invalid refresh token."},
        )
    except InactiveUserError:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "USER_INACTIVE", "message": "User account is inactive."},
        )

    return ApiResponse.success(
        RefreshResponse(
            access_token=access_token,
            token_type="bearer",
            user=_user_to_response(user),
        ).model_dump()
    )


# ── POST /auth/logout ─────────────────────────────────────────────────────────

@router.post("/logout", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def logout(
    response: Response,
) -> ApiResponse:
    """Logout: clears the HttpOnly refresh token cookie server-side."""
    _clear_refresh_cookie(response)
    use_case = LogoutUseCase()
    await use_case.execute()
    return ApiResponse.success({"message": "Logged out successfully."})


# ── GET /auth/me ──────────────────────────────────────────────────────────────

@router.get("/me", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> ApiResponse:
    """Return the currently authenticated user."""
    return ApiResponse.success(_user_to_response(current_user).model_dump())


# ── POST /auth/forgot-password ────────────────────────────────────────────────

@router.post("/forgot-password", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def forgot_password(
    body: ForgotPasswordRequest,
    user_repo: UserRepository = Depends(get_user_repository),
    reset_repo: PasswordResetRepository = Depends(get_password_reset_repository),
) -> ApiResponse:
    """Initiate the password-reset flow by sending an OTP to the supplied email.

    Always returns a generic success response — email existence is never
    disclosed to prevent account enumeration.
    """
    use_case = ForgotPasswordUseCase(
        user_repo=user_repo,
        reset_repo=reset_repo,
        send_otp_email=send_otp_email,
    )

    try:
        await use_case.execute(body.email)
    except Exception as exc:
        # Any email-delivery failure is logged inside the use case; respond
        # generically so the caller cannot infer whether the email existed.
        logger.error(
            "forgot_password.delivery_error",
            extra={"error_type": type(exc).__name__},
        )

    return ApiResponse.success(
        {"message": "If that email is registered, you will receive a verification code shortly."}
    )


# ── POST /auth/verify-reset-otp ───────────────────────────────────────────────

@router.post("/verify-reset-otp", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def verify_reset_otp(
    body: VerifyOtpRequest,
    user_repo: UserRepository = Depends(get_user_repository),
    reset_repo: PasswordResetRepository = Depends(get_password_reset_repository),
) -> ApiResponse:
    """Verify the OTP and return a short-lived password-reset authorisation token.

    The returned reset_token must be supplied to /reset-password and must NOT
    be persisted in browser storage.
    """
    use_case = VerifyOtpUseCase(reset_repo=reset_repo, user_repo=user_repo)

    try:
        raw_token = await use_case.execute(body.email, body.otp)
    except OtpExpiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": exc.message},
        )
    except OtpMaxAttemptsError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "OTP_MAX_ATTEMPTS", "message": exc.message},
        )
    except (OtpInvalidError, OtpAlreadyConsumedError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INVALID", "message": exc.message},
        )

    return ApiResponse.success(
        VerifyOtpResponse(reset_token=raw_token).model_dump()
    )


# ── POST /auth/reset-password ─────────────────────────────────────────────────

@router.post("/reset-password", response_model=ApiResponse, status_code=status.HTTP_200_OK)
async def reset_password(
    body: ResetPasswordRequest,
    reset_repo: PasswordResetRepository = Depends(get_password_reset_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
) -> ApiResponse:
    """Reset the user's password using a valid, unexpired reset token.

    The reset token is consumed atomically; subsequent calls with the same
    token will be rejected.
    """
    use_case = ResetPasswordUseCase(
        reset_repo=reset_repo,
        password_hasher=password_hasher,
    )

    try:
        await use_case.execute(
            reset_token=body.reset_token,
            new_password=body.new_password,
            confirm_password=body.confirm_password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": str(exc)},
        )
    except ResetTokenExpiredError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "RESET_TOKEN_EXPIRED", "message": exc.message},
        )
    except ResetTokenInvalidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "RESET_TOKEN_INVALID", "message": exc.message},
        )

    return ApiResponse.success({"message": "Password has been reset successfully. Please log in."})
