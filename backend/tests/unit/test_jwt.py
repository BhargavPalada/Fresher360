"""Unit tests for JWTService."""
import uuid

import pytest

from app.domain.enums.user_role import UserRole
from app.domain.exceptions.authentication import TokenExpiredError, TokenInvalidError
from app.infrastructure.auth.jwt import JWTService


@pytest.fixture
def jwt_service() -> JWTService:
    return JWTService()


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


class TestAccessToken:
    def test_encode_decode_roundtrip(self, jwt_service: JWTService, user_id: uuid.UUID) -> None:
        token = jwt_service.encode_access_token(user_id, UserRole.ADMIN)
        payload = jwt_service.decode_access_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["role"] == UserRole.ADMIN.value
        assert payload["type"] == "access"

    def test_access_token_contains_role(self, jwt_service: JWTService, user_id: uuid.UUID) -> None:
        token = jwt_service.encode_access_token(user_id, UserRole.USER)
        payload = jwt_service.decode_access_token(token)
        assert payload["role"] == "USER"

    def test_invalid_token_raises(self, jwt_service: JWTService) -> None:
        with pytest.raises(TokenInvalidError):
            jwt_service.decode_access_token("not.a.valid.token")

    def test_refresh_token_rejected_as_access(
        self, jwt_service: JWTService, user_id: uuid.UUID
    ) -> None:
        """Refresh token must not be accepted as an access token."""
        refresh = jwt_service.encode_refresh_token(user_id)
        with pytest.raises(TokenInvalidError):
            jwt_service.decode_access_token(refresh)

    def test_tampered_token_raises(self, jwt_service: JWTService, user_id: uuid.UUID) -> None:
        token = jwt_service.encode_access_token(user_id, UserRole.ADMIN)
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(TokenInvalidError):
            jwt_service.decode_access_token(tampered)


class TestRefreshToken:
    def test_encode_decode_roundtrip(self, jwt_service: JWTService, user_id: uuid.UUID) -> None:
        token = jwt_service.encode_refresh_token(user_id)
        payload = jwt_service.decode_refresh_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"

    def test_refresh_token_has_no_role(self, jwt_service: JWTService, user_id: uuid.UUID) -> None:
        """Refresh tokens intentionally do not contain role — role is re-read from DB."""
        token = jwt_service.encode_refresh_token(user_id)
        payload = jwt_service.decode_refresh_token(token)
        assert "role" not in payload

    def test_access_token_rejected_as_refresh(
        self, jwt_service: JWTService, user_id: uuid.UUID
    ) -> None:
        access = jwt_service.encode_access_token(user_id, UserRole.ADMIN)
        with pytest.raises(TokenInvalidError):
            jwt_service.decode_refresh_token(access)

    def test_invalid_token_raises(self, jwt_service: JWTService) -> None:
        with pytest.raises(TokenInvalidError):
            jwt_service.decode_refresh_token("garbage")
