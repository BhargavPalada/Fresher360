"""Password hashing using Argon2id.

Infrastructure concern — implements IPasswordHasher interface.
Never log passwords. Never return plaintext from this module.
"""
from argon2 import PasswordHasher as Argon2PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

from app.application.auth.interfaces import IPasswordHasher


class PasswordHasher(IPasswordHasher):
    """Argon2id password hasher.

    Argon2id is the recommended algorithm per OWASP (2024).
    It is memory-hard and resistant to GPU-based brute force attacks.
    """

    def __init__(self) -> None:
        # Using recommended parameters: time_cost=2, memory_cost=65536 (64MB), parallelism=1
        self._hasher = Argon2PasswordHasher(
            time_cost=2,
            memory_cost=65536,
            parallelism=1,
        )

    def hash(self, plain_password: str) -> str:
        """Hash a plaintext password. Returns a safe Argon2id hash string."""
        return self._hasher.hash(plain_password)

    def verify(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plaintext password against a stored hash.

        Returns True if they match, False otherwise.
        Never raises on mismatch — only logs domain-safe result.
        """
        try:
            return self._hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
