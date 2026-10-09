"""Pydantic schemas for Task API requests and responses.

Consistent envelope { data, error } through ApiResponse.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums.task import TaskCategory, TaskPriority, TaskStatus


class AssignedFresherResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str
    status: str
    completion_summary: str | None = None
    document_url: str | None = None
    comments: str | None = None
    assessment_status: str | None = "Pending"
    assessment_result: str | None = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    title: str
    description: str | None = None
    category: str
    priority: str
    due_date: str | None = None
    status: str
    comments: str | None = None
    attachment_url: str | None = None
    assigned_freshers: list[AssignedFresherResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class CreateTaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Task title (Mandatory)")
    description: str = Field(..., min_length=1, description="Detailed instructions and information (Mandatory)")
    category: TaskCategory = Field(..., description="Technical / Training / Functional")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    due_date: datetime = Field(..., description="Task due date (Mandatory)")
    status: TaskStatus = Field(default=TaskStatus.PENDING, description="Initial task status")
    assigned_fresher_ids: list[uuid.UUID] = Field(
        ...,
        min_length=1,
        description="One or multiple freshers assigned to this task (At least one required)",
    )
    comments: str | None = Field(default=None, description="Initial instructions or comments")
    attachment_url: str | None = Field(default=None, description="URL to the attached file")


class UpdateTaskRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: TaskCategory | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None
    status: TaskStatus | None = None
    assigned_fresher_ids: list[uuid.UUID] | None = None
    comments: str | None = None
    attachment_url: str | None = None


class UpdateAssignmentRequest(BaseModel):
    status: TaskStatus | None = None
    comments: str | None = None
    assessment_status: str | None = None
    assessment_result: str | None = None


class UpdateTaskCommentsRequest(BaseModel):
    comments: str | None = Field(default=None, description="Task comments content (null to clear)")


class SubmitTaskRequest(BaseModel):
    completion_summary: str | None = None
    document_url: str | None = Field(default=None, description="URL of the uploaded document")
    comments: str | None = Field(default=None, description="Fresher comments on submission")
