"""Application configuration — all values from environment variables.

Never hard-code secrets. All production values must come from env.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/fresher360"

    # ── JWT Access Token ─────────────────────────────────────────────────────
    JWT_SECRET: str = "REPLACE_WITH_SECURE_RANDOM_VALUE"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15

    # ── JWT Refresh Token ────────────────────────────────────────────────────
    JWT_REFRESH_SECRET: str = "REPLACE_WITH_DIFFERENT_SECURE_RANDOM_VALUE"
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]
    CORS_ALLOWED_ORIGIN_REGEX: str | None = None

    # ── Cookie Security ──────────────────────────────────────────────────────
    COOKIE_SECURE: bool | None = None
    COOKIE_SAMESITE: str = "lax"

    # ── Seed ─────────────────────────────────────────────────────────────────
    SEED_ADMIN_EMAIL: str = "admin@fresher360.com"
    SEED_ADMIN_PASSWORD: str = ""
    SEED_ADMIN_FIRST_NAME: str = "Admin"
    SEED_ADMIN_LAST_NAME: str = "User"

    SEED_USER_EMAIL: str = "user@fresher360.com"
    SEED_USER_PASSWORD: str = ""
    SEED_USER_FIRST_NAME: str = "John"
    SEED_USER_LAST_NAME: str = "Doe"

    # ── Email (SMTP) ──────────────────────────────────────────────────────────
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@fresher360.com"
    MAIL_FROM_NAME: str = "Fresher360"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = False

    # ── OTP / Password-reset ─────────────────────────────────────────────────
    # HMAC key for OTP verifier — must be at least 32 chars in production.
    OTP_HMAC_SECRET: str = "REPLACE_WITH_SECURE_RANDOM_OTP_HMAC_KEY_MIN_32_CHARS"
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RATE_LIMIT_COUNT: int = 3
    OTP_RATE_LIMIT_WINDOW_MINUTES: int = 10
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # ── App ──────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    DEBUG: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
