"""Central API router — aggregates all versioned routers."""
from fastapi import APIRouter

from app.api.v1 import auth, tasks, users, uploads

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(tasks.router)
api_router.include_router(uploads.router)
