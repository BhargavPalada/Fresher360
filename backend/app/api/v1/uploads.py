"""File uploads API."""
import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.dependencies import require_authenticated_user
from app.domain.entities.user import User
from app.schemas.auth import ApiResponse

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("", response_model=ApiResponse)
async def upload_file(
    file: UploadFile,
    current_user: User = Depends(require_authenticated_user),
) -> ApiResponse:
    """Upload a file securely and get a public URL for it."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_FILE", "message": "No filename provided."},
        )

    # Generate a unique filename to prevent collisions and overwrite issues
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "UPLOAD_FAILED", "message": f"Failed to save file: {str(e)}"},
        )

    # Return the URL path
    return ApiResponse.success({"url": f"/api/v1/uploads/files/{unique_filename}"})
