"""FastAPI application factory.

Registers routes, middleware, CORS, exception handlers, and lifespan.
"""
from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import get_settings
from app.domain.exceptions.authentication import AuthenticationError
from app.domain.exceptions.authorization import AuthorizationError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("startup: Fresher360 API starting", extra={"env": settings.APP_ENV})
    yield
    logger.info("shutdown: Fresher360 API stopping")


# ── App factory ───────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="Fresher360 API",
        description="Backend API for the Fresher360 corporate hackathon application.",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────────────────────────────
    cors_origin_regex = (
        settings.CORS_ALLOWED_ORIGIN_REGEX
        if settings.CORS_ALLOWED_ORIGIN_REGEX is not None
        else (r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if settings.APP_ENV == "development" else None)
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ALLOWED_ORIGINS,
        allow_origin_regex=cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request correlation ID middleware ────────────────────────────────────
    @app.middleware("http")
    async def add_request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # ── Exception handlers ───────────────────────────────────────────────────
    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(
        request: Request, exc: AuthenticationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"data": None, "error": {"code": "UNAUTHORIZED", "message": exc.message}},
        )

    @app.exception_handler(AuthorizationError)
    async def authorization_error_handler(
        request: Request, exc: AuthorizationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"data": None, "error": {"code": "FORBIDDEN", "message": exc.message}},
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            code = detail.get("code", "ERROR")
            message = detail.get("message", "An error occurred.")
        elif isinstance(detail, str):
            code = "ERROR"
            message = detail
        else:
            code = "ERROR"
            message = str(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "data": None,
                "error": {"code": code, "message": message},
                "detail": detail,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled server exception: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "data": None,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "Internal server error occurred while processing request.",
                },
            },
        )

    # ── Routes ───────────────────────────────────────────────────────────────
    app.include_router(api_router)
    app.mount("/api/v1/uploads/files", StaticFiles(directory="uploads"), name="uploads")

    @app.get("/health", tags=["Health"])
    async def health() -> dict:
        return {"status": "ok", "env": settings.APP_ENV}

    return app


app = create_app()
