"""User domain entity.

Pure Python dataclass — zero framework dependencies.
No FastAPI, SQLAlchemy, or JWT imports allowed here.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from app.domain.enums.user_role import UserRole


@dataclass
class User:
    id: uuid.UUID
    email: str
    password_hash: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # ── Factory ────────────────────────────────────────────────────────────
    @classmethod
    def create(
        cls,
        *,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str,
        role: UserRole,
    ) -> "User":
        now = datetime.now(timezone.utc)
        return cls(
            id=uuid.uuid4(),
            email=email.lower().strip(),
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            role=role,
            is_active=True,
            created_at=now,
            updated_at=now,
        )

    # ── Domain helpers ─────────────────────────────────────────────────────
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
