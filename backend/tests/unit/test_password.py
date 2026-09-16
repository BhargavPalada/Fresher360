"""Unit tests for PasswordHasher."""
import pytest

from app.infrastructure.auth.password import PasswordHasher


@pytest.fixture
def hasher() -> PasswordHasher:
    return PasswordHasher()


class TestPasswordHasher:
    def test_hash_returns_string(self, hasher: PasswordHasher) -> None:
        result = hasher.hash("MyPassword123!")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_hash_is_not_plaintext(self, hasher: PasswordHasher) -> None:
        plain = "MyPassword123!"
        result = hasher.hash(plain)
        assert result != plain

    def test_hash_differs_between_invocations(self, hasher: PasswordHasher) -> None:
        """Argon2id uses random salt — each hash must be unique."""
        h1 = hasher.hash("SamePassword!")
        h2 = hasher.hash("SamePassword!")
        assert h1 != h2

    def test_correct_password_verifies(self, hasher: PasswordHasher) -> None:
        plain = "CorrectHorseBatteryStaple"
        hashed = hasher.hash(plain)
        assert hasher.verify(plain, hashed) is True

    def test_wrong_password_fails_verification(self, hasher: PasswordHasher) -> None:
        hashed = hasher.hash("CorrectPassword")
        assert hasher.verify("WrongPassword", hashed) is False

    def test_empty_password_verifies_correctly(self, hasher: PasswordHasher) -> None:
        plain = ""
        hashed = hasher.hash(plain)
        assert hasher.verify(plain, hashed) is True

    def test_invalid_hash_returns_false(self, hasher: PasswordHasher) -> None:
        """Should not raise — should return False."""
        assert hasher.verify("any_password", "not_a_valid_hash") is False
