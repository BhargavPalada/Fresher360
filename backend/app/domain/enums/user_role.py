"""User role enumeration — backend-controlled, never from client."""
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"
