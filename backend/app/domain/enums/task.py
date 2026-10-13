"""Task-related enumerations — backend-controlled."""
from __future__ import annotations

from enum import Enum


class TaskCategory(str, Enum):
    DOCUMENTATION = "Documentation"
    TECHNICAL = "Technical"
    TRAINING = "Training"
    FUNCTIONAL = "Functional"


class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class TaskStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class AssessmentStatus(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    PASSED = "Passed"
    FAILED = "Failed"

